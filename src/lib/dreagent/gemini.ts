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
  if (/403|permission|not allowed|billing|paid/i.test(msg)) { status = 403; code = "billing" }
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
 * Start a streaming generation. Returns the SDK async iterable of response
 * chunks. Throws DreApiError / DreNotConfiguredError on failure to start.
 */
export async function streamChat(params: StreamChatParams) {
  const ai = await getClient(params.workspaceId)
  try {
    const stream = await ai.models.generateContentStream({
      model: params.model,
      contents: buildContents(params.turns),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: (params.grounding ? { tools: [{ googleSearch: {} }] } : {}) as any,
    })
    return stream
  } catch (err) {
    throw toApiError(err, "Chat generation failed to start")
  }
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
