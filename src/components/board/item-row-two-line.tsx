"use client"

import { Fragment } from "react"
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

export function ItemRowTwoLine({
  item,
  visibleColumns,
  members,
  onTitleChange,
  onCellChange,
  onViewClick,
  rowIndex,
}: {
  item: BoardItem
  visibleColumns: ColumnDefinition[]
  members: Profile[]
  onTitleChange: (title: string) => void
  onCellChange: (columnId: string, value: any) => void
  onViewClick: () => void
  rowIndex: number
}) {
  // Split columns into two halves
  const midpoint = Math.ceil(visibleColumns.length / 2)
  const line1Columns = visibleColumns.slice(0, midpoint)
  const line2Columns = visibleColumns.slice(midpoint)

  // Alternate background colors
  const bgColor = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"

  return (
    <Fragment>
      {/* Line 1: Title + First half of columns */}
      <tr className={`border-t border-border/40 hover:bg-muted/20 cursor-pointer ${bgColor}`}>
        <td className="min-w-[260px] px-4 py-2 font-medium text-[#0A1628]">
          <div className="flex items-center gap-2">
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
              className="h-7 w-full min-w-0 border-transparent bg-transparent px-0 hover:bg-white focus:bg-white focus:border-border"
            />
          </div>
        </td>
        {line1Columns.map((column) => (
          <td
            key={column.id}
            className="px-4 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <CellEditor
              column={column}
              item={item}
              members={members}
              onChange={(value) => onCellChange(column.id, value)}
            />
          </td>
        ))}
        {/* Empty cell for View button column on line 1 */}
        <td className="px-4 py-2" />
      </tr>

      {/* Line 2: Remaining columns */}
      <tr className={`border-t border-border/40 hover:bg-muted/20 cursor-pointer ${bgColor}`}>
        {/* Empty cell for title column on line 2 */}
        <td className="min-w-[260px] px-4 py-2" />
        {line2Columns.map((column) => (
          <td
            key={column.id}
            className="px-4 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <CellEditor
              column={column}
              item={item}
              members={members}
              onChange={(value) => onCellChange(column.id, value)}
            />
          </td>
        ))}
        {/* View button on line 2 */}
        <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={onViewClick}>
            View
          </Button>
        </td>
      </tr>
    </Fragment>
  )
}
