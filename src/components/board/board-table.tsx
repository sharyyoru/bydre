"use client"

import { Fragment } from "react"
import { ColumnDefinition, BoardItem, BoardGroup } from "@/lib/board/columns"
import { ItemRowColumnar, columnWidthClass } from "./item-row-columnar"

type Profile = { id: string; email: string; full_name: string | null }

export function BoardTable({
  items,
  visibleColumns,
  members,
  groups,
  onTitleChange,
  onCellChange,
  onViewClick,
  onMoveToGroup,
  onDelete,
}: {
  items: BoardItem[]
  visibleColumns: ColumnDefinition[]
  members: Profile[]
  groups: BoardGroup[]
  onTitleChange: (itemId: string, title: string) => void
  onCellChange: (item: BoardItem, columnId: string, value: any) => void
  onViewClick: (item: BoardItem) => void
  onMoveToGroup: (itemId: string, groupId: string) => void
  onDelete: (item: BoardItem) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-left">
            <th className="px-3 py-2 font-medium text-muted-foreground min-w-[280px]">Name</th>
            {visibleColumns.map((column) => (
              <th key={column.id} className={`px-3 py-2 font-medium text-muted-foreground ${columnWidthClass(column)}`}>
                {column.name}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium text-muted-foreground min-w-[90px]">Comments</th>
            <th className="px-2 py-2 min-w-[48px]" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={visibleColumns.length + 3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                No items yet. Click Add item to create one.
              </td>
            </tr>
          )}
          {items.map((item, itemIndex) => (
            <Fragment key={item.id}>
              <ItemRowColumnar
                item={item}
                visibleColumns={visibleColumns}
                members={members}
                groups={groups}
                rowIndex={itemIndex}
                onTitleChange={(title) => onTitleChange(item.id, title)}
                onCellChange={(columnId, value) => onCellChange(item, columnId, value)}
                onViewClick={() => onViewClick(item)}
                onMoveToGroup={(groupId) => onMoveToGroup(item.id, groupId)}
                onDelete={() => onDelete(item)}
              />
              {item.sub_items?.map((sub) => (
                <ItemRowColumnar
                  key={sub.id}
                  item={sub}
                  visibleColumns={visibleColumns}
                  members={members}
                  groups={groups}
                  isSubItem
                  rowIndex={itemIndex}
                  onTitleChange={(title) => onTitleChange(sub.id, title)}
                  onCellChange={(columnId, value) => onCellChange(sub, columnId, value)}
                  onViewClick={() => onViewClick(sub)}
                  onMoveToGroup={(groupId) => onMoveToGroup(sub.id, groupId)}
                  onDelete={() => onDelete(sub)}
                />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
