"use client"

import { useState } from "react"
import {
  ColumnDefinition,
  BoardItem,
  Profile,
  priorityClass,
  getPriorityOption,
} from "@/lib/board/columns"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const UNASSIGNED = "__unassigned__"

/**
 * Kanban grouped by person — each team member is a column holding the items
 * assigned to them, plus an "Unassigned" column. Mirrors the "Group by
 * Assignee" board in ClickUp / Asana swimlanes / Monday Workload.
 *
 * Dragging a card onto a person's column (re)assigns that item to them.
 * Items with multiple assignees appear in each assignee's column.
 */
export function PeopleKanbanView({
  columns,
  items,
  members,
  onItemClick,
  onReassign,
}: {
  columns: ColumnDefinition[]
  items: Record<string, BoardItem[]>
  members: Profile[]
  onItemClick: (item: BoardItem) => void
  onReassign: (itemId: string, userIds: string[]) => void
}) {
  const allItems = Object.values(items).flat()
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const itemsFor = (userId: string) => {
    if (userId === UNASSIGNED) return allItems.filter((it) => (it.assignees?.length || 0) === 0)
    return allItems.filter((it) => (it.assignees || []).some((a) => a.user_id === userId))
  }

  // Only show member columns that have at least one item, plus every member is
  // still reachable as a drop target via the always-present columns below.
  const memberColumns = members
    .map((m) => ({ id: m.id, name: m.full_name || m.email, member: m }))

  const columnsToRender = [
    ...memberColumns,
    { id: UNASSIGNED, name: "Unassigned", member: null as Profile | null },
  ]

  const handleDrop = (targetId: string) => {
    if (!draggingId) return
    onReassign(draggingId, targetId === UNASSIGNED ? [] : [targetId])
    setDraggingId(null)
    setDragOver(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columnsToRender.map((col) => {
        const colItems = itemsFor(col.id)
        const isOver = dragOver === col.id
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragOver !== col.id) setDragOver(col.id)
            }}
            onDragLeave={() => setDragOver((cur) => (cur === col.id ? null : cur))}
            onDrop={() => handleDrop(col.id)}
            className={`min-w-[280px] w-[280px] shrink-0 rounded-2xl p-3 flex flex-col gap-3 transition-colors ${
              isOver ? "bg-[#0A1628]/10 ring-2 ring-[#0A1628]/30" : "bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              {col.member ? (
                <Avatar className="h-6 w-6 bg-[#0A1628]">
                  <AvatarFallback className="text-[10px] bg-[#0A1628] text-white">
                    {initials(col.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                  ?
                </span>
              )}
              <h3 className="font-semibold text-sm truncate">{col.name}</h3>
              <span className="ml-auto rounded-full bg-background px-2 text-xs text-muted-foreground">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[40px]">
              {colItems.map((item) => (
                <PersonCard
                  key={`${col.id}-${item.id}`}
                  item={item}
                  columns={columns}
                  isDragging={draggingId === item.id}
                  onClick={() => onItemClick(item)}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDragOver(null)
                  }}
                />
              ))}
              {colItems.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {col.id === UNASSIGNED ? "Nothing unassigned" : "No items"}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PersonCard({
  item,
  columns,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  item: BoardItem
  columns: ColumnDefinition[]
  isDragging: boolean
  onClick: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const statusColumn = columns.find((c) => c.type === "status")
  const priorityColumn = columns.find((c) => c.type === "priority")
  const dateColumn = columns.find((c) => c.name === "Due Date")
  const status = (statusColumn?.settings?.options || []).find(
    (o: any) => o.id === item.values?.[statusColumn?.id || ""]
  ) as { name: string; color: string } | undefined
  const priorityValue = priorityColumn ? item.values?.[priorityColumn.id] : item.priority
  const priority = getPriorityOption(priorityValue || "medium")
  const dueDate = dateColumn ? item.values?.[dateColumn.id] : item.due_date

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white rounded-xl border border-border/60 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-[#0A1628] leading-snug">{item.title}</h4>
        {priority && (
          <Badge className={`border-0 text-[10px] shrink-0 ${priorityClass(priority.id)}`}>
            {priority.name}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {status ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.name}
          </span>
        ) : (
          <span />
        )}
        {dueDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
