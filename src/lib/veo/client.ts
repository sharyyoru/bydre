import { GoogleGenAI } from "@google/genai"
import { getCredential } from "@/lib/social-monitor/credentials"
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  GeneratedImage,
  VeoApiError,
  VeoNotConfiguredError,
  VideoResultFile,
} from "./types"

/**
 * Resolve a GoogleGenAI client for a workspace using the shared `gemini`
 * credential (the same Google API key powers Gemini, Imagen, and Veo).
 * Requires a PAID Google API tier for Veo/Imagen.
 */
async function getClient(workspaceId: string): Promise<{ ai: GoogleGenAI; apiKey: string }> {
  const cred = await getCredential(workspaceId, "gemini")
  if (!cred) throw new VeoNotConfiguredError()
  return { ai: new GoogleGenAI({ apiKey: cred.secret }), apiKey: cred.secret }
}

function toApiError(err: unknown, fallback: string): VeoApiError {
  const msg = err instanceof Error ? err.message : fallback
  // Google SDK surfaces status codes in the message (e.g. "got status: 403").
  let status = 502
  if (/403|permission|not allowed|billing|paid/i.test(msg)) status = 403
  else if (/429|quota|rate/i.test(msg)) status = 429
  else if (/400|invalid/i.test(msg)) status = 400
  return new VeoApiError(msg, status)
}

export interface GenerateImagesParams {
  workspaceId: string
  prompt: string
  model?: string
  numberOfImages?: number
  aspectRatio?: string
}

/** Generate still images with Imagen. Synchronous (returns base64 bytes). */
export async function generateImages(
  params: GenerateImagesParams
): Promise<{ images: GeneratedImage[]; model: string }> {
  const { ai } = await getClient(params.workspaceId)
  const model = params.model || DEFAULT_IMAGE_MODEL
  try {
    const res = await ai.models.generateImages({
      model,
      prompt: params.prompt,
      config: {
        numberOfImages: params.numberOfImages || 1,
        aspectRatio: params.aspectRatio || "1:1",
      },
    })
    const images: GeneratedImage[] = (res.generatedImages || [])
      .map((g) => ({
        bytes: g.image?.imageBytes || "",
        mimeType: g.image?.mimeType || "image/png",
      }))
      .filter((i) => i.bytes)
    if (!images.length) throw new VeoApiError("No images returned (prompt may be blocked)", 422)
    return { images, model }
  } catch (err) {
    if (err instanceof VeoApiError) throw err
    throw toApiError(err, "Image generation failed")
  }
}

export interface StartVideoParams {
  workspaceId: string
  prompt: string
  model?: string
  aspectRatio?: string
  resolution?: string
  negativePrompt?: string
  /** Optional first-frame image for image-to-video. */
  image?: { bytes: string; mimeType: string }
}

/**
 * Stable fallback model. Veo 3 preview is heavily quota-throttled / requires
 * allowlisting on many keys, whereas Veo 2 has broadly usable quota.
 */
const VIDEO_FALLBACK_MODEL = "veo-2.0-generate-001"

/** Whether a Veo error should trigger a fallback to another model. */
function shouldFallbackVideo(err: VeoApiError): boolean {
  return err.status === 429 || /not.?found|not available|no longer|unsupported/i.test(err.message)
}

/** Start a Veo video generation. Returns the long-running operation name. */
export async function startVideo(
  params: StartVideoParams
): Promise<{ operationName: string; model: string }> {
  const { ai } = await getClient(params.workspaceId)
  const primary = params.model || DEFAULT_VIDEO_MODEL
  const attempts = Array.from(new Set([primary, VIDEO_FALLBACK_MODEL]))
  let lastError: VeoApiError | null = null

  for (const model of attempts) {
    const isPrimary = model === primary
    try {
      const request: Record<string, unknown> = {
        model,
        prompt: params.prompt,
        config: {
          aspectRatio: params.aspectRatio || "16:9",
          // resolution (e.g. 1080p) is a Veo 3 feature; skip it on the fallback.
          ...(params.resolution && isPrimary ? { resolution: params.resolution } : {}),
          ...(params.negativePrompt ? { negativePrompt: params.negativePrompt } : {}),
          numberOfVideos: 1,
        },
      }
      if (params.image?.bytes) {
        request.image = { imageBytes: params.image.bytes, mimeType: params.image.mimeType }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operation = await ai.models.generateVideos(request as any)
      const operationName = (operation as { name?: string }).name
      if (!operationName) throw new VeoApiError("No operation name returned", 502)
      return { operationName, model }
    } catch (err) {
      lastError = err instanceof VeoApiError ? err : toApiError(err, "Video generation failed to start")
      if (!shouldFallbackVideo(lastError)) throw lastError
    }
  }
  throw lastError || new VeoApiError("Video generation failed to start", 502)
}

export interface VideoPollResult {
  done: boolean
  videos: VideoResultFile[]
  error?: string
}

/** Poll a Veo operation by its stored name. */
export async function pollVideo(
  workspaceId: string,
  operationName: string
): Promise<VideoPollResult> {
  const { ai } = await getClient(workspaceId)
  try {
    // The SDK reads `.name` off the passed operation to build the request.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const op = await ai.operations.getVideosOperation({ operation: { name: operationName } as any })
    if (!op.done) return { done: false, videos: [] }
    if (op.error) {
      return { done: true, videos: [], error: (op.error as { message?: string }).message || "Generation failed" }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generated = (op.response as any)?.generatedVideos || []
    const videos: VideoResultFile[] = generated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((g: any) => ({ uri: g?.video?.uri || "", mimeType: g?.video?.mimeType || "video/mp4" }))
      .filter((v: VideoResultFile) => v.uri)
    return { done: true, videos }
  } catch (err) {
    throw toApiError(err, "Failed to poll video operation")
  }
}

/** Build an authorized download URL for a Google file URI (server-side only). */
export function buildDownloadUrl(uri: string, apiKey: string): string {
  return uri.includes("?") ? `${uri}&key=${apiKey}` : `${uri}?key=${apiKey}`
}

/** Resolve just the API key for a workspace (used by the download proxy). */
export async function getApiKey(workspaceId: string): Promise<string> {
  const cred = await getCredential(workspaceId, "gemini")
  if (!cred) throw new VeoNotConfiguredError()
  return cred.secret
}
