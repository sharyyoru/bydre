"use client"

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
import { CalendarIcon, Star } from "lucide-react"

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
    case "url":
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 w-full"
        />
      )

    case "number":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value)
            onChange(v)
          }}
          className="h-8 w-24"
        />
      )

    case "currency":
      return (
        <Input
          type="number"
          step={0.01}
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value)
            onChange(v)
          }}
          className="h-8 w-28"
        />
      )

    case "dropdown":
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

function getContrastColor(hexColor: string) {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#0A1628" : "#FFFFFF"
}
