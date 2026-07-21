"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, MessageSquare, MoreHorizontal, FolderInput, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDefinition, BoardItem, BoardGroup, priorityColor } from "@/lib/board/columns"
import { CellEditor } from "./columns/cell-editor"

type Profile = { id: string; email: string; full_name: string | null }

// Fixed minimum widths per column type keep the grid aligned across rows.
export function columnWidthClass(column: ColumnDefinition) {
  switch (column.type) {
    case "people":
      return "min-w-[130px]"
    case "status":
      return "min-w-[150px]"
    case "priority":
      return "min-w-[120px]"
    case "date":
      return column.settings?.include_time ? "min-w-[220px]" : "min-w-[130px]"
    case "checkbox":
    case "rating":
      return "min-w-[90px]"
    case "number":
    case "currency":
      return "min-w-[110px]"
    case "url":
      return "min-w-[120px]"
    default:
      return "min-w-[160px]"
  }
}

export function ItemRowColumnar({
  item,
  visibleColumns,
  members,
  groups,
  isSubItem,
  rowIndex,
  onTitleChange,
  onCellChange,
  onViewClick,
  onMoveToGroup,
  onDelete,
}: {
  item: BoardItem
  visibleColumns: ColumnDefinition[]
  members: Profile[]
  groups: BoardGroup[]
  isSubItem?: boolean
  rowIndex: number
  onTitleChange: (title: string) => void
  onCellChange: (columnId: string, value: any) => void
  onViewClick: () => void
  onMoveToGroup: (groupId: string) => void
  onDelete: () => void
}) {
  const bgColor = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/60"

  return (
    <tr
      className={`border-t border-border/40 hover:bg-muted/20 ${bgColor}`}
      style={{ borderLeft: `4px solid ${priorityColor(item.priority)}` }}
    >
      {/* Name */}
      <td className={`px-3 py-2 ${isSubItem ? "pl-9" : ""}`}>
        <div className="flex items-center gap-2 min-w-[240px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-[#0A1628]"
            aria-label={`View ${item.title}`}
            onClick={(event) => {
              event.stopPropagation()
              onViewClick()
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Input
            defaultValue={item.title}
            onBlur={(e) => {
              if (e.target.value !== item.title) onTitleChange(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-8 w-full min-w-0 border-transparent bg-transparent px-0 font-medium text-[#0A1628] hover:bg-white focus:bg-white focus:border-border"
          />
        </div>
      </td>

      {/* One aligned cell per column */}
      {visibleColumns.map((column) => (
        <td key={column.id} className={`px-3 py-2 align-middle ${columnWidthClass(column)}`}>
          <div onClick={(e) => e.stopPropagation()}>
            <CellEditor
              column={column}
              item={item}
              members={members}
              onChange={(value) => onCellChange(column.id, value)}
            />
          </div>
        </td>
      ))}

      {/* Comments */}
      <td className="px-3 py-2 text-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-muted-foreground hover:text-[#0A1628]"
          onClick={(e) => {
            e.stopPropagation()
            onViewClick()
          }}
        >
          <MessageSquare className="h-4 w-4" />
          {item.comments_count > 0 && <span className="text-xs">{item.comments_count}</span>}
        </Button>
      </td>

      {/* Row actions */}
      <td className="px-2 py-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewClick}>
              <Eye className="mr-2 h-4 w-4" /> View / edit
            </DropdownMenuItem>
            {groups.length > 1 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-4 w-4" /> Move to group
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {groups
                    .filter((g) => g.id !== item.group_id)
                    .map((g) => (
                      <DropdownMenuItem key={g.id} onClick={() => onMoveToGroup(g.id)}>
                        <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
