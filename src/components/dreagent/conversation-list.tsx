"use client"

import { useState } from "react"
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DreConversation } from "@/lib/dreagent/types"

interface Props {
  conversations: DreConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onRename, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const startEdit = (c: DreConversation) => {
    setEditingId(c.id)
    setDraft(c.title)
  }
  const commit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim())
    setEditingId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2 rounded-full bg-[#0A1628] hover:bg-[#0A1628]/90">
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet.</p>
        )}
        {conversations.map((c) => {
          const active = c.id === activeId
          return (
            <div
              key={c.id}
              className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                active ? "bg-[#0A1628]/10 text-[#0A1628]" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {editingId === c.id ? (
                <>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit()
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    className="min-w-0 flex-1 rounded border border-border bg-white px-1.5 py-0.5 text-sm outline-none"
                  />
                  <button onClick={commit} className="shrink-0 text-emerald-600" type="button"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingId(null)} className="shrink-0 text-muted-foreground" type="button"><X className="h-4 w-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => onSelect(c.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left" type="button">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => startEdit(c)} className="rounded p-1 hover:bg-background" title="Rename" type="button">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this conversation?")) onDelete(c.id) }}
                      className="rounded p-1 text-destructive hover:bg-background"
                      title="Delete"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
