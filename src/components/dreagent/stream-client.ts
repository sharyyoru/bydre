import { Attachment, Source } from "@/lib/dreagent/types"

export interface SendParams {
  workspaceId: string
  conversationId: string
  content: string
  attachments: Attachment[]
  model: string
  grounding: boolean
  mode?: "send" | "regenerate" | "edit"
  targetMessageId?: string
}

export interface StreamHandlers {
  onText: (delta: string) => void
  onDone: (payload: {
    user_message_id: string | null
    model_message_id: string | null
    sources: Source[]
    model: string
    title?: string
  }) => void
  onError: (message: string, code?: string) => void
}

/**
 * POST to the streaming chat endpoint and dispatch NDJSON events.
 * Handles non-streamed JSON errors (e.g. missing key) too.
 */
export async function sendChatStream(
  params: SendParams,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/dreagent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      workspace_id: params.workspaceId,
      conversation_id: params.conversationId,
      message: { content: params.content, attachments: params.attachments },
      model: params.model,
      grounding: params.grounding,
      mode: params.mode || "send",
      target_message_id: params.targetMessageId,
    }),
  })

  const contentType = res.headers.get("content-type") || ""
  if (!res.ok && !contentType.includes("ndjson")) {
    const j = await res.json().catch(() => ({}))
    handlers.onError(j.error || "Request failed", j.code)
    return
  }
  if (!res.body) {
    handlers.onError("No response stream")
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const dispatch = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    let evt: Record<string, unknown>
    try {
      evt = JSON.parse(trimmed)
    } catch {
      return
    }
    if (evt.type === "text") handlers.onText(String(evt.value || ""))
    else if (evt.type === "done")
      handlers.onDone({
        user_message_id: (evt.user_message_id as string) ?? null,
        model_message_id: (evt.model_message_id as string) ?? null,
        sources: (evt.sources as Source[]) || [],
        model: String(evt.model || ""),
        title: evt.title as string | undefined,
      })
    else if (evt.type === "error") handlers.onError(String(evt.error || "Generation failed"), evt.code as string)
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl)
      buffer = buffer.slice(nl + 1)
      dispatch(line)
    }
  }
  if (buffer) dispatch(buffer)
}
