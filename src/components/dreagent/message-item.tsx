"use client"

import { useState } from "react"
import { Sparkles, Copy, Check, RefreshCw, Pencil, FileText, ExternalLink, Loader2 } from "lucide-react"
import { Attachment, DreMessage, Source } from "@/lib/dreagent/types"
import { MarkdownMessage } from "./markdown-message"

function AttachmentPreviews({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a, i) =>
        a.kind === "image" && a.data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`data:${a.mimeType};base64,${a.data}`}
            alt={a.name}
            className="h-20 w-20 rounded-lg object-cover"
          />
        ) : (
          <span key={i} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            {a.name}
          </span>
        )
      )}
    </div>
  )
}

function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          title={s.title}
        >
          <ExternalLink className="h-3 w-3" />
          <span className="max-w-[160px] truncate">{s.title}</span>
        </a>
      ))}
    </div>
  )
}

interface Props {
  message: DreMessage
  streaming?: boolean
  canRegenerate?: boolean
  onEdit?: (m: DreMessage) => void
  onRegenerate?: () => void
}

export function MessageItem({ message, streaming, canRegenerate, onEdit, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (message.role === "user") {
    return (
      <div className="group flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#0A1628] px-4 py-3 text-[15px] text-white">
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          <AttachmentPreviews attachments={message.attachments} />
        </div>
        <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={copy} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Copy" type="button">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {onEdit && (
            <button onClick={() => onEdit(message)} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Edit & resend" type="button">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A1628] to-[#1e3a5f] text-[#D4AF37]">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {message.content ? (
          <MarkdownMessage content={message.content} />
        ) : streaming ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        ) : null}
        {streaming && message.content && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[#0A1628] align-middle" />
        )}
        <SourceChips sources={message.sources} />
        {!streaming && (
          <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={copy} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Copy" type="button">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {canRegenerate && onRegenerate && (
              <button onClick={onRegenerate} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Regenerate" type="button">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
