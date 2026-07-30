"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { resolveWorkspaceId } from "@/lib/workspace-client"
import { toast } from "sonner"
import { Sparkles, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Attachment,
  ChatModel,
  DEFAULT_MODEL,
  DreConversation,
  DreMessage,
  isChatModel,
} from "@/lib/dreagent/types"
import { ConversationList } from "./conversation-list"
import { MessageItem } from "./message-item"
import { Composer } from "./composer"
import { sendChatStream } from "./stream-client"

const SUGGESTIONS = [
  "Draft an Instagram caption for a Dubai Marina apartment listing",
  "Summarize the key steps to buy off-plan property in the UAE",
  "Write a short cold-outreach message to a property investor",
  "Give me 5 content ideas for a real-estate YouTube channel",
]

const tempId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`

export function DreAgent({ workspaceId: workspaceIdentifier }: { workspaceId: string }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState("")
  const [conversations, setConversations] = useState<DreConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DreMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [model, setModel] = useState<ChatModel>(DEFAULT_MODEL)
  const [grounding, setGrounding] = useState(false)
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [railOpen, setRailOpen] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    resolveWorkspaceId(supabase, workspaceIdentifier).then((id) => setWorkspaceId(id))
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", auth.user.id)
        .maybeSingle()
      const p = profile as { full_name?: string; email?: string } | null
      setFirstName((p?.full_name || p?.email || "").split(" ")[0].split("@")[0] || "")
    })
  }, [workspaceIdentifier])

  const loadConversations = useCallback(async () => {
    if (!workspaceId) return
    const res = await fetch(`/api/dreagent/conversations?workspace_id=${workspaceId}`)
    if (res.ok) setConversations((await res.json()).conversations || [])
  }, [workspaceId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!workspaceId) return
      const res = await fetch(
        `/api/dreagent/messages?workspace_id=${workspaceId}&conversation_id=${conversationId}`
      )
      if (res.ok) setMessages((await res.json()).messages || [])
    },
    [workspaceId]
  )

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const selectConversation = (id: string) => {
    if (streaming) return
    setActiveId(id)
    setRailOpen(false)
    const convo = conversations.find((c) => c.id === id)
    if (convo && isChatModel(convo.model)) setModel(convo.model)
    loadMessages(id)
  }

  const newConversation = () => {
    if (streaming) return
    setActiveId(null)
    setMessages([])
    setEditing(null)
    setInput("")
    setAttachments([])
    setRailOpen(false)
  }

  const renameConversation = async (id: string, title: string) => {
    if (!workspaceId) return
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)))
    await fetch("/api/dreagent/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id, title }),
    })
  }

  const deleteConversation = async (id: string) => {
    if (!workspaceId) return
    setConversations((cs) => cs.filter((c) => c.id !== id))
    if (activeId === id) newConversation()
    await fetch("/api/dreagent/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id }),
    })
  }

  const runStream = useCallback(
    async (
      conversationId: string,
      opts: {
        content: string
        attachments: Attachment[]
        mode: "send" | "regenerate" | "edit"
        targetMessageId?: string
        userTempId?: string
      }
    ) => {
      if (!workspaceId) return
      const modelTempId = tempId()
      setMessages((prev) => [
        ...prev,
        {
          id: modelTempId,
          conversation_id: conversationId,
          workspace_id: workspaceId,
          role: "model",
          content: "",
          attachments: [],
          sources: [],
          model,
          created_at: new Date().toISOString(),
        },
      ])
      setStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller

      await sendChatStream(
        {
          workspaceId,
          conversationId,
          content: opts.content,
          attachments: opts.attachments,
          model,
          grounding,
          mode: opts.mode,
          targetMessageId: opts.targetMessageId,
        },
        {
          onText: (delta) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === modelTempId ? { ...m, content: m.content + delta } : m))
            ),
          onDone: (payload) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (opts.userTempId && m.id === opts.userTempId && payload.user_message_id)
                  return { ...m, id: payload.user_message_id }
                if (m.id === modelTempId)
                  return {
                    ...m,
                    id: payload.model_message_id || m.id,
                    sources: payload.sources,
                    model: payload.model,
                  }
                return m
              })
            )
            setStreaming(false)
            abortRef.current = null
            // Reflect the model that actually worked (fallback may have kicked in).
            if (payload.model && isChatModel(payload.model) && payload.model !== model) {
              setModel(payload.model)
            }
            loadConversations()
          },
          onError: (message, code) => {
            setMessages((prev) => prev.filter((m) => !(m.id === modelTempId && !m.content)))
            setStreaming(false)
            abortRef.current = null
            if (code === "not_configured") toast.error("Add your Google (Gemini) API key in API Settings first.")
            else if (code === "model") toast.error("That model isn't available for your API key — try Gemini 2.0 Flash.")
            else if (code === "billing") toast.error("This model needs a paid Google API tier / quota.")
            else if (code === "quota") toast.error("Rate limit or quota exceeded — try again shortly.")
            else toast.error(message || "Generation failed")
          },
        },
        controller.signal
      ).catch((e) => {
        if ((e as Error).name !== "AbortError") toast.error("Stream failed")
        setStreaming(false)
        abortRef.current = null
        setMessages((prev) => prev.filter((m) => !(m.id === modelTempId && !m.content)))
      })
    },
    [workspaceId, model, grounding, loadConversations]
  )

  const ensureConversation = async (firstContent: string): Promise<string | null> => {
    if (activeId) return activeId
    if (!workspaceId) return null
    const res = await fetch("/api/dreagent/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, model, title: firstContent.slice(0, 60) }),
    })
    if (!res.ok) {
      toast.error("Could not start conversation")
      return null
    }
    const convo = (await res.json()).conversation as DreConversation
    setConversations((cs) => [convo, ...cs])
    setActiveId(convo.id)
    return convo.id
  }

  const handleSend = async (content: string, atts: Attachment[]) => {
    if (streaming || !workspaceId) return
    const isEdit = !!editing
    const conversationId = await ensureConversation(content)
    if (!conversationId) return

    const userTempId = tempId()
    setInput("")
    setAttachments([])

    if (isEdit) {
      // Truncate local messages from the edited one onward, then re-add.
      const idx = messages.findIndex((m) => m.id === editing)
      const kept = idx === -1 ? messages : messages.slice(0, idx)
      setMessages([
        ...kept,
        {
          id: userTempId,
          conversation_id: conversationId,
          workspace_id: workspaceId,
          role: "user",
          content,
          attachments: atts,
          sources: [],
          model: null,
          created_at: new Date().toISOString(),
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: userTempId,
          conversation_id: conversationId,
          workspace_id: workspaceId,
          role: "user",
          content,
          attachments: atts,
          sources: [],
          model: null,
          created_at: new Date().toISOString(),
        },
      ])
    }

    const mode = isEdit ? "edit" : "send"
    const targetMessageId = isEdit ? editing || undefined : undefined
    setEditing(null)
    await runStream(conversationId, { content, attachments: atts, mode, targetMessageId, userTempId })
  }

  const handleRegenerate = async () => {
    if (streaming || !activeId) return
    setMessages((prev) => {
      const lastModelIdx = [...prev].reverse().findIndex((m) => m.role === "model")
      if (lastModelIdx === -1) return prev
      const idx = prev.length - 1 - lastModelIdx
      return prev.slice(0, idx)
    })
    await runStream(activeId, { content: "", attachments: [], mode: "regenerate" })
  }

  const handleEdit = (m: DreMessage) => {
    setEditing(m.id)
    setInput(m.content)
    setAttachments(m.attachments || [])
  }

  const stop = () => {
    abortRef.current?.abort()
    setStreaming(false)
  }

  const lastModelId = [...messages].reverse().find((m) => m.role === "model")?.id
  const showEmpty = !activeId && messages.length === 0

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-2xl border border-border/60 bg-white">
      {/* Rail (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-border/60 md:block">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
        />
      </aside>

      {/* Chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <div className="md:hidden">
            <Sheet open={railOpen} onOpenChange={setRailOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><PanelLeftOpen className="h-4 w-4" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <ConversationList
                  conversations={conversations}
                  activeId={activeId}
                  onSelect={selectConversation}
                  onNew={newConversation}
                  onRename={renameConversation}
                  onDelete={deleteConversation}
                />
              </SheetContent>
            </Sheet>
          </div>
          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          <span className="font-semibold text-[#0A1628]">DreAgent</span>
          <span className="text-xs text-muted-foreground">powered by Gemini</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {showEmpty ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-4">
              <h1 className="bg-gradient-to-r from-[#0A1628] to-[#D4AF37] bg-clip-text text-3xl font-bold text-transparent">
                Hello{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">How can I help you today?</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-xl border border-border/60 p-3 text-left text-sm text-[#0A1628] transition-colors hover:bg-muted/50"
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {messages.map((m) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  streaming={streaming && m.id === lastModelId}
                  canRegenerate={!streaming && m.id === lastModelId}
                  onEdit={m.role === "user" ? handleEdit : undefined}
                  onRegenerate={handleRegenerate}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <Composer
            model={model}
            onModelChange={setModel}
            grounding={grounding}
            onGroundingChange={setGrounding}
            streaming={streaming}
            editing={!!editing}
            onCancelEdit={() => { setEditing(null); setInput(""); setAttachments([]) }}
            onStop={stop}
            onSend={handleSend}
            value={input}
            onValueChange={setInput}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>
      </div>
    </div>
  )
}
