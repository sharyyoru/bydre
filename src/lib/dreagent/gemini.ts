import { GoogleGenAI } from "@google/genai"
import { getCredential } from "@/lib/social-monitor/credentials"
import { Attachment, DreApiError, DreNotConfiguredError, Role, Source } from "./types"

async function getClient(workspaceId: string): Promise<GoogleGenAI> {
  const cred = await getCredential(workspaceId, "gemini")
  if (!cred) throw new DreNotConfiguredError()
  return new GoogleGenAI({ apiKey: cred.secret })
}

export function toApiError(err: unknown, fallback: string): DreApiError {
  if (err instanceof DreApiError) return err
  const msg = err instanceof Error ? err.message : fallback
  let status = 502
  let code = "error"
  if (/404|not.?found|no longer available|not available|unsupported/i.test(msg)) { status = 400; code = "model" }
  else if (/403|permission|not allowed|billing|paid/i.test(msg)) { status = 403; code = "billing" }
  else if (/429|quota|rate|resource.?exhausted/i.test(msg)) { status = 429; code = "quota" }
  else if (/400|invalid/i.test(msg)) { status = 400; code = "invalid" }
  return new DreApiError(msg, status, code)
}

export interface TurnInput {
  role: Role
  content: string
  attachments?: Attachment[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Part = Record<string, any>

/** Convert stored/incoming turns into Gemini `contents`. */
export function buildContents(turns: TurnInput[]) {
  return turns.map((t) => {
    const parts: Part[] = []
    if (t.content) parts.push({ text: t.content })
    for (const a of t.attachments || []) {
      if (a.data) parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } })
    }
    if (!parts.length) parts.push({ text: "" })
    return { role: t.role, parts }
  })
}

export interface StreamChatParams {
  workspaceId: string
  model: string
  grounding: boolean
  turns: TurnInput[]
}

/**
 * Fallback model chain. Google API keys differ in which models they can call
 * (e.g. some reject 2.5, some reject 2.0), so on a model-availability error we
 * transparently try the next candidate until one starts.
 */
const FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
]

/**
 * Start a streaming generation, falling back across model names on
 * model-availability errors. Returns the SDK async iterable + the model that
 * actually worked. Throws DreApiError / DreNotConfiguredError otherwise.
 */
export async function streamChat(params: StreamChatParams): Promise<{ stream: AsyncIterable<unknown>; model: string }> {
  const ai = await getClient(params.workspaceId)
  const contents = buildContents(params.turns)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (params.grounding ? { tools: [{ googleSearch: {} }] } : {}) as any

  const candidates = Array.from(new Set([params.model, ...FALLBACK_MODELS]))
  let lastError: DreApiError | null = null

  for (const model of candidates) {
    try {
      const stream = (await ai.models.generateContentStream({ model, contents, config })) as AsyncIterable<unknown>
      return { stream, model }
    } catch (err) {
      lastError = toApiError(err, "Chat generation failed to start")
      // Only keep trying other models when it's an availability problem.
      if (lastError.code !== "model") throw lastError
    }
  }
  throw lastError || new DreApiError("No available Gemini model for this API key", 400, "model")
}

/** Merge grounding source links out of a streamed chunk (dedup by uri). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeSources(existing: Source[], chunk: any): Source[] {
  const meta = chunk?.candidates?.[0]?.groundingMetadata
  const groundingChunks = meta?.groundingChunks || []
  if (!groundingChunks.length) return existing
  const map = new Map(existing.map((s) => [s.uri, s]))
  for (const g of groundingChunks) {
    const web = g?.web
    if (web?.uri && !map.has(web.uri)) {
      map.set(web.uri, { uri: web.uri, title: web.title || web.uri })
    }
  }
  return Array.from(map.values())
}
