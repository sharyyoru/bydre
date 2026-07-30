"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Paperclip, ArrowUp, Square, Globe, X, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Attachment, ChatModel, DREAGENT_MODELS } from "@/lib/dreagent/types"
import { fileToAttachment, totalBase64, MAX_TOTAL_BASE64 } from "./attachments"

interface Props {
  model: ChatModel
  onModelChange: (m: ChatModel) => void
  grounding: boolean
  onGroundingChange: (v: boolean) => void
  streaming: boolean
  editing: boolean
  onCancelEdit: () => void
  onStop: () => void
  onSend: (content: string, attachments: Attachment[]) => void
  value: string
  onValueChange: (v: string) => void
  attachments: Attachment[]
  onAttachmentsChange: (a: Attachment[]) => void
}

export function Composer(props: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loadingFiles, setLoadingFiles] = useState(false)

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setLoadingFiles(true)
    try {
      const added: Attachment[] = []
      for (const f of Array.from(files)) added.push(await fileToAttachment(f))
      const next = [...props.attachments, ...added]
      if (totalBase64(next) > MAX_TOTAL_BASE64) {
        toast.error("Attachments too large — total must stay under ~3.5MB")
        return
      }
      props.onAttachmentsChange(next)
    } catch {
      toast.error("Failed to read attachment")
    } finally {
      setLoadingFiles(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const submit = () => {
    if (props.streaming) return
    if (!props.value.trim() && !props.attachments.length) return
    props.onSend(props.value, props.attachments)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {props.editing && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          Editing a message — sending will replace it and everything after.
          <button onClick={props.onCancelEdit} className="font-medium underline" type="button">Cancel</button>
        </div>
      )}
      {props.attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {props.attachments.map((a, i) => (
            <div key={i} className="relative">
              {a.kind === "image" && a.data ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:${a.mimeType};base64,${a.data}`} alt={a.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <span className="flex h-16 items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 text-xs">
                  <FileText className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{a.name}</span>
                </span>
              )}
              <button
                onClick={() => props.onAttachmentsChange(props.attachments.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-[#0A1628] p-0.5 text-white"
                type="button"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-white p-2 shadow-sm focus-within:border-[#0A1628]/40">
        <textarea
          value={props.value}
          onChange={(e) => props.onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask DreAgent…"
          className="max-h-48 w-full resize-none bg-transparent px-2 py-1.5 text-[15px] outline-none"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <div className="flex items-center gap-2 px-1 pt-1">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/*,.md,.csv,.json"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileRef.current?.click()} title="Attach files" type="button">
            {loadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>

          <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            Search
            <Switch checked={props.grounding} onCheckedChange={props.onGroundingChange} className="ml-1 scale-75" />
          </label>

          <Select value={props.model} onValueChange={(v) => props.onModelChange(v as ChatModel)}>
            <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DREAGENT_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto">
            {props.streaming ? (
              <Button size="icon" className="h-8 w-8 rounded-full" onClick={props.onStop} title="Stop" type="button">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-[#0A1628] hover:bg-[#0A1628]/90"
                onClick={submit}
                disabled={!props.value.trim() && !props.attachments.length}
                title="Send"
                type="button"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        DreAgent can make mistakes. Verify important info.
      </p>
    </div>
  )
}
