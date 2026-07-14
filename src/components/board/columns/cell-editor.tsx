"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  ColumnDefinition,
  BoardItem,
  priorityOptions,
} from "@/lib/board/columns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Eye, Star } from "lucide-react"

export function CellEditor({
  column,
  item,
  members,
  onChange,
}: {
  column: ColumnDefinition
  item: BoardItem
  members: { id: string; email: string; full_name: string | null }[]
  onChange: (value: any) => void
}) {
  const value = item.values?.[column.id]

  switch (column.type) {
    case "status":
      return (
        <Select value={value || ""} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger className="w-36 h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(column.settings?.options || []).map((option: any) => (
              <SelectItem key={option.id} value={option.id}>
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: option.color }}
                />
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "priority":
      return (
        <Select value={value || "medium"} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "people": {
      const selected = (item.assignees || []).map((a) => a.user_id)
      const current = selected[0] || "none"
      return (
        <Select
          value={current}
          onValueChange={(v) => {
            const ids = v === "none" ? [] : [v]
            onChange(ids)
          }}
        >
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name || m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {value ? format(new Date(value), "MMM d") : "Set date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )

    case "text":
    case "email":
    case "phone":
      return <DeferredTextInput value={value} onCommit={onChange} />

    case "url":
      return <UrlInput value={value} onCommit={onChange} />

    case "number":
      return <DeferredNumberInput value={value} onCommit={onChange} className="h-8 w-24" />

    case "currency":
      return <DeferredNumberInput value={value} onCommit={onChange} className="h-8 w-28" step="0.01" />

    case "dropdown":
      return column.settings?.multi_select ? (
        <MultiSelectDropdown column={column} value={value} onChange={onChange} />
      ) : (
        <Select value={value || ""} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger className="w-36 h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(column.settings?.options || []).map((option: any) => (
              <SelectItem key={option.id} value={option.id}>
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: option.color }}
                />
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "label": {
      const selected = Array.isArray(value) ? value : []
      const options = column.settings?.options || []
      return (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          {options.map((option: any) => {
            const isSelected = selected.includes(option.id)
            return (
              <Badge
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer text-xs"
                style={
                  isSelected
                    ? { backgroundColor: option.color, color: getContrastColor(option.color) }
                    : {}
                }
                onClick={() => {
                  const next = isSelected
                    ? selected.filter((id: string) => id !== option.id)
                    : [...selected, option.id]
                  onChange(next)
                }}
              >
                {option.name}
              </Badge>
            )
          })}
        </div>
      )
    }

    case "checkbox":
      return (
        <Checkbox
          checked={!!value}
          onCheckedChange={(v) => onChange(!!v)}
          onClick={(e) => e.stopPropagation()}
        />
      )

    case "rating": {
      const rating = Math.min(5, Math.max(0, value || 0))
      return (
        <div className="flex" onClick={(e) => e.stopPropagation()}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 cursor-pointer ${
                i < rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-muted-foreground"
              }`}
              onClick={() => onChange(i + 1)}
            />
          ))}
        </div>
      )
    }

    case "progress":
      return <span className="text-sm text-muted-foreground">Auto</span>

    case "file":
      return <span className="text-sm text-muted-foreground">Files</span>

    case "formula":
    case "dependency":
    case "mirror":
    default:
      return <span className="text-sm text-muted-foreground">{value || "—"}</span>
  }
}

function DeferredTextInput({ value, onCommit }: { value: unknown; onCommit: (value: string | null) => void }) {
  const [draft, setDraft] = useState(value ? String(value) : "")
  useEffect(() => setDraft(value ? String(value) : ""), [value])
  return <Input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onCommit(draft || null)} className="h-8 w-full" />
}

function MultiSelectDropdown({ column, value, onChange }: { column: ColumnDefinition; value: unknown; onChange: (value: string[]) => void }) {
  const selected = Array.isArray(value) ? value : value ? [String(value)] : []
  const options = column.settings?.options || []
  return <div className="flex max-w-[220px] flex-wrap gap-1">{options.map((option: any) => {
    const active = selected.includes(option.id)
    return <Badge key={option.id} variant={active ? "default" : "outline"} className="cursor-pointer" style={active ? { backgroundColor: option.color, color: getContrastColor(option.color) } : undefined} onClick={() => onChange(active ? selected.filter((id) => id !== option.id) : [...selected, option.id])}>{option.name}</Badge>
  })}</div>
}

function UrlInput({ value, onCommit }: { value: unknown; onCommit: (value: string | null) => void }) {
  const [draft, setDraft] = useState(value ? String(value) : "")
  useEffect(() => setDraft(value ? String(value) : ""), [value])
  const href = draft && /^(https?:\/\/)/i.test(draft) ? draft : draft ? `https://${draft}` : ""
  return <div className="flex items-center gap-1"><Input type="url" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onCommit(draft || null)} className="h-8 min-w-0 flex-1" />{href && <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0"><a href={href} target="_blank" rel="noopener noreferrer" aria-label="Open asset link"><Eye className="h-4 w-4" /></a></Button>}</div>
}

function DeferredNumberInput({ value, onCommit, className, step }: { value: unknown; onCommit: (value: number | null) => void; className: string; step?: string }) {
  const normalizedValue = value === null || value === undefined ? "" : String(value)
  const [draft, setDraft] = useState(normalizedValue)
  useEffect(() => setDraft(normalizedValue), [normalizedValue])
  return <Input type="number" step={step} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onCommit(draft === "" ? null : Number(draft))} className={className} />
}

function getContrastColor(hexColor: string) {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#0A1628" : "#FFFFFF"
}
