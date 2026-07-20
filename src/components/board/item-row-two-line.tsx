"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { ColumnDefinition, BoardItem } from "@/lib/board/columns"
import { CellEditor } from "./columns/cell-editor"

type Profile = {
  id: string
  email: string
  full_name: string | null
}

// Columns that need extra horizontal space (e.g. datetime with time)
function isWideColumn(column: ColumnDefinition) {
  return column.type === "date" && column.settings?.include_time === true
}

function FieldWithLabel({
  label,
  wide,
  children,
}: {
  label: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? "min-w-[240px]" : "min-w-[150px]"}`}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}

export function ItemRowTwoLine({
  item,
  visibleColumns,
  members,
  totalColumns,
  isSubItem,
  onTitleChange,
  onCellChange,
  onViewClick,
  rowIndex,
}: {
  item: BoardItem
  visibleColumns: ColumnDefinition[]
  members: Profile[]
  totalColumns: number
  isSubItem?: boolean
  onTitleChange: (title: string) => void
  onCellChange: (columnId: string, value: any) => void
  onViewClick: () => void
  rowIndex: number
}) {
  // Split columns into two balanced halves
  const midpoint = Math.ceil(visibleColumns.length / 2)
  const line1Columns = visibleColumns.slice(0, midpoint)
  const line2Columns = visibleColumns.slice(midpoint)

  // Alternate background colors for easier visual separation
  const bgColor = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"

  return (
    <tr className={`border-t border-border/40 hover:bg-muted/20 ${bgColor}`}>
      <td colSpan={totalColumns} className={`px-4 py-3 ${isSubItem ? "pl-10" : ""}`}>
        <div className="flex flex-col gap-3">
          {/* Line 1: Title + first half of fields */}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="flex items-center gap-2 min-w-[240px] flex-1">
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
            {line1Columns.map((column) => (
              <FieldWithLabel key={column.id} label={column.name} wide={isWideColumn(column)}>
                <div onClick={(e) => e.stopPropagation()}>
                  <CellEditor
                    column={column}
                    item={item}
                    members={members}
                    onChange={(value) => onCellChange(column.id, value)}
                  />
                </div>
              </FieldWithLabel>
            ))}
          </div>

          {/* Line 2: second half of fields + View button */}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            {line2Columns.map((column) => (
              <FieldWithLabel key={column.id} label={column.name} wide={isWideColumn(column)}>
                <div onClick={(e) => e.stopPropagation()}>
                  <CellEditor
                    column={column}
                    item={item}
                    members={members}
                    onChange={(value) => onCellChange(column.id, value)}
                  />
                </div>
              </FieldWithLabel>
            ))}
            <div className="ml-auto self-end">
              <Button variant="outline" size="sm" onClick={onViewClick}>
                View
              </Button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}
