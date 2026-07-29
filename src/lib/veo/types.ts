export type MediaKind = "image" | "video"
export type GenerationStatus = "queued" | "running" | "succeeded" | "failed"

export const DEFAULT_VIDEO_MODEL = "veo-3.0-generate-preview"
export const DEFAULT_IMAGE_MODEL = "imagen-4.0-generate-001"

export const IMAGE_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const
export const VIDEO_ASPECT_RATIOS = ["16:9", "9:16"] as const
export const VIDEO_RESOLUTIONS = ["720p", "1080p"] as const

export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number]
export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number]
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number]

export interface GeneratedImage {
  /** base64 (no data: prefix) */
  bytes: string
  mimeType: string
}

export interface VideoResultFile {
  uri: string
  mimeType: string
}

export interface MediaGeneration {
  id: string
  workspace_id: string
  created_by: string | null
  kind: MediaKind
  model: string
  prompt: string
  negative_prompt: string | null
  config: Record<string, unknown>
  status: GenerationStatus
  operation_name: string | null
  result: VideoResultFile[] | { count: number }[] | Record<string, unknown>[]
  error: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

/** Thrown when the Google/Gemini credential is missing. */
export class VeoNotConfiguredError extends Error {
  constructor() {
    super("Google (Gemini) API key not configured")
    this.name = "VeoNotConfiguredError"
  }
}

/** Wraps Google API failures with an HTTP-ish status for the route layer. */
export class VeoApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "VeoApiError"
    this.status = status
  }
}
