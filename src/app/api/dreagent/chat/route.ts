import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember } from "../_helpers"
import { streamChat, mergeSources, TurnInput } from "@/lib/dreagent/gemini"
import { Attachment, DEFAULT_MODEL, DreApiError, DreNotConfiguredError, isChatModel, Source } from "@/lib/dreagent/types"

export const runtime = "nodejs"
export const maxDuration = 60

const enc = new TextEncoder()
const line = (obj: unknown) => enc.encode(JSON.stringify(obj) + "\n")

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normAttachments(raw: any): Attachment[] {
  if (!Array.isArray(raw)) return []
  return raw
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => ({
      kind: a?.kind === "image" ? "image" : "file",
      name: String(a?.name || "file"),
      mimeType: String(a?.mimeType || "application/octet-stream"),
      data: typeof a?.data === "string" ? a.data : undefined,
    }))
    .filter((a) => a.name) as Attachment[]
}

/** Keep image bytes for re-display; drop non-image file bytes when persisting. */
function persistable(atts: Attachment[]): Attachment[] {
  return atts.map((a) =>
    a.kind === "image" ? a : { kind: a.kind, name: a.name, mimeType: a.mimeType }
  )
}

/**
 * POST — streaming chat (NDJSON). Body:
 * { workspace_id, conversation_id, message:{ content, attachments[] },
 *   model?, grounding?, mode?: 'send'|'regenerate'|'edit', target_message_id? }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const workspaceId = String(body.workspace_id || "")
  const conversationId = String(body.conversation_id || "")
  const mode = (["send", "regenerate", "edit"].includes(String(body.mode)) ? body.mode : "send") as
    | "send"
    | "regenerate"
    | "edit"
  if (!workspaceId || !conversationId) {
    return NextResponse.json({ error: "workspace_id and conversation_id required" }, { status: 400 })
  }

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()

  const { data: convo } = await supabase
    .from("dreagent_conversations")
    .select("id, model")
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (!convo) return NextResponse.json({ error: "conversation not found" }, { status: 404 })

  const model = isChatModel(body.model)
    ? body.model
    : isChatModel((convo as { model: string }).model)
    ? (convo as { model: string }).model
    : DEFAULT_MODEL
  const grounding = body.grounding === true

  const { data: existing } = await supabase
    .from("dreagent_messages")
    .select("id, role, content, attachments, created_at")
    .eq("conversation_id", conversationId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (existing || []) as any[]

  // Determine prior turns, the (optional) new user turn, and rows to delete.
  let priorRows = rows
  let userTurn: { content: string; attachments: Attachment[] } | null = null
  let deleteFromCreatedAt: string | null = null

  const msgIn = (body.message || {}) as { content?: string; attachments?: unknown }
  const liveAttachments = normAttachments(msgIn.attachments)
  const liveContent = String(msgIn.content || "").trim()

  if (mode === "regenerate") {
    const lastModelIdx = [...rows].reverse().findIndex((r) => r.role === "model")
    if (lastModelIdx === -1) return NextResponse.json({ error: "nothing to regenerate" }, { status: 400 })
    const idx = rows.length - 1 - lastModelIdx
    deleteFromCreatedAt = rows[idx].created_at
    priorRows = rows.slice(0, idx)
  } else if (mode === "edit") {
    const targetId = String(body.target_message_id || "")
    const idx = rows.findIndex((r) => r.id === targetId)
    if (idx === -1) return NextResponse.json({ error: "target_message_id not found" }, { status: 400 })
    deleteFromCreatedAt = rows[idx].created_at
    priorRows = rows.slice(0, idx)
    userTurn = { content: liveContent, attachments: liveAttachments }
  } else {
    if (!liveContent && !liveAttachments.length) {
      return NextResponse.json({ error: "message content required" }, { status: 400 })
    }
    userTurn = { content: liveContent, attachments: liveAttachments }
  }

  const turns: TurnInput[] = priorRows.map((r) => ({
    role: r.role,
    content: r.content,
    attachments: normAttachments(r.attachments),
  }))
  if (userTurn) turns.push({ role: "user", content: userTurn.content, attachments: userTurn.attachments })

  // Validate credential + start generation up-front so config errors are plain JSON.
  let sdkStream: AsyncIterable<unknown>
  let usedModel = model
  try {
    const started = await streamChat({ workspaceId, model, grounding, turns })
    sdkStream = started.stream
    usedModel = started.model
  } catch (err) {
    if (err instanceof DreNotConfiguredError) {
      return NextResponse.json(
        { error: "Google (Gemini) API key not configured", code: "not_configured" },
        { status: 501 }
      )
    }
    const e = err as DreApiError
    return NextResponse.json({ error: e.message, code: e.code || "error" }, { status: e.status || 502 })
  }

  const isFirst = priorRows.length === 0

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let userMessageId: string | null = null
      let modelMessageId: string | null = null
      let fullText = ""
      let sources: Source[] = []

      try {
        // Apply deletions for regenerate/edit.
        if (deleteFromCreatedAt) {
          await supabase
            .from("dreagent_messages")
            .delete()
            .eq("conversation_id", conversationId)
            .eq("workspace_id", workspaceId)
            .gte("created_at", deleteFromCreatedAt)
        }

        // Persist the new user turn (if any) before streaming the answer.
        if (userTurn) {
          const { data: inserted } = await supabase
            .from("dreagent_messages")
            .insert({
              conversation_id: conversationId,
              workspace_id: workspaceId,
              role: "user",
              content: userTurn.content,
              attachments: persistable(userTurn.attachments),
            })
            .select("id")
            .single()
          userMessageId = (inserted as { id: string } | null)?.id || null
        }

        for await (const chunk of sdkStream) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = (chunk as any)?.text
          if (typeof text === "string" && text.length) {
            fullText += text
            controller.enqueue(line({ type: "text", value: text }))
          }
          sources = mergeSources(sources, chunk)
        }

        const { data: modelRow } = await supabase
          .from("dreagent_messages")
          .insert({
            conversation_id: conversationId,
            workspace_id: workspaceId,
            role: "model",
            content: fullText,
            sources,
            model: usedModel,
          })
          .select("id")
          .single()
        modelMessageId = (modelRow as { id: string } | null)?.id || null

        // Bump updated_at (+ set title on the first exchange).
        const update: Record<string, unknown> = { model: usedModel }
        if (isFirst && userTurn?.content) update.title = userTurn.content.slice(0, 60)
        await supabase
          .from("dreagent_conversations")
          .update(update)
          .eq("id", conversationId)
          .eq("workspace_id", workspaceId)

        controller.enqueue(
          line({
            type: "done",
            user_message_id: userMessageId,
            model_message_id: modelMessageId,
            sources,
            model: usedModel,
            title: (update.title as string) || undefined,
          })
        )
      } catch (err) {
        const e = err as DreApiError
        // Persist any partial answer so the conversation stays consistent.
        if (fullText) {
          await supabase.from("dreagent_messages").insert({
            conversation_id: conversationId,
            workspace_id: workspaceId,
            role: "model",
            content: fullText,
            sources,
            model: usedModel,
          })
        }
        controller.enqueue(
          line({ type: "error", error: e?.message || "Generation failed", code: e?.code || "error" })
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
