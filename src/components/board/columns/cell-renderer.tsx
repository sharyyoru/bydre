"use client"

import { format } from "date-fns"
import {
  ColumnDefinition,
  getStatusOption,
  getDropdownOption,
  getLabelOptions,
  getPriorityOption,
  priorityClass,
  formatCurrency,
  computeProgress,
} from "@/lib/board/columns"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Star } from "lucide-react"
import type { BoardItem } from "@/lib/board/columns"

export function CellRenderer({
  column,
  item,
}: {
  column: ColumnDefinition
  item: BoardItem
}) {
  const value = item.values?.[column.id]

  switch (column.type) {
    case "status": {
      const option = getStatusOption(column, value)
      if (!option) return <span className="text-muted-foreground">—</span>
      return (
        <Badge
          style={{ backgroundColor: option.color, color: getContrastColor(option.color) }}
          className="border-0"
        >
          {option.name}
        </Badge>
      )
    }

    case "priority": {
      const p = getPriorityOption(value || "medium")
      if (!p) return <span className="text-muted-foreground">—</span>
      return <Badge className={`border-0 capitalize ${priorityClass(p.id)}`}>{p.name}</Badge>
    }

    case "people": {
      const people = item.assignees
      if (!people || people.length === 0) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex -space-x-2">
          {people.map((a) => (
            <Avatar key={a.user_id} className="h-6 w-6 border border-white bg-[#0A1628]">
              <AvatarFallback className="text-[10px] bg-[#0A1628] text-white">
                {initials(a.profiles.full_name || a.profiles.email)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )
    }

    case "date": {
      if (!value) return <span className="text-muted-foreground">—</span>
      return <span className="text-sm">{format(new Date(value), "MMM d")}</span>
    }

    case "text":
    case "email":
    case "phone": {
      return <span className="text-sm truncate">{value || "—"}</span>
    }

    case "url": {
      if (!value) return <span className="text-muted-foreground">—</span>
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#D4AF37] hover:underline truncate"
          onClick={(e) => e.stopPropagation()}
        >
          Link
        </a>
      )
    }

    case "number": {
      if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>
      return <span className="text-sm">{value}</span>
    }

    case "currency": {
      if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>
      return <span className="text-sm">{formatCurrency(value, column.settings?.currency || "USD")}</span>
    }

    case "dropdown": {
      const option = getDropdownOption(column, value)
      if (!option) return <span className="text-muted-foreground">—</span>
      return (
        <Badge
          style={{ backgroundColor: option.color, color: getContrastColor(option.color) }}
          className="border-0"
        >
          {option.name}
        </Badge>
      )
    }

    case "label": {
      const labels = getLabelOptions(column, value)
      if (labels.length === 0) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <Badge
              key={label.id}
              style={{ backgroundColor: label.color, color: getContrastColor(label.color) }}
              className="border-0 text-xs"
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )
    }

    case "checkbox": {
      return <Checkbox checked={!!value} disabled />
    }

    case "rating": {
      const rating = Math.min(5, Math.max(0, value || 0))
      return (
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-muted-foreground"}`}
            />
          ))}
        </div>
      )
    }

    case "progress": {
      const progress = computeProgress(item, column)
      return <Progress value={progress} className="h-2 w-24" />
    }

    case "file": {
      const files = value || []
      if (!Array.isArray(files) || files.length === 0) return <span className="text-muted-foreground">—</span>
      return <span className="text-sm">{files.length} file(s)</span>
    }

    case "formula":
    case "dependency":
    case "mirror":
    default: {
      return <span className="text-sm text-muted-foreground">{value || "—"}</span>
    }
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getContrastColor(hexColor: string) {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#0A1628" : "#FFFFFF"
}
