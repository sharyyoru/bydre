"use client"

import {
  ColumnDefinition,
  BoardItem,
  Profile,
  priorityClass,
  getPriorityOption,
} from "@/lib/board/columns"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function KanbanView({
  columns,
  items,
  members,
  onItemClick,
  onStatusChange,
  onAssigneesChange,
}: {
  columns: ColumnDefinition[]
  items: Record<string, BoardItem[]>
  members: Profile[]
  onItemClick: (item: BoardItem) => void
  onStatusChange: (itemId: string, columnId: string, value: string) => void
  onAssigneesChange: (itemId: string, userIds: string[]) => void
}) {
  const statusColumn = columns.find((c) => c.type === "status")
  const options = (statusColumn?.settings?.options || []) as { id: string; name: string; color: string }[]
  const allItems = Object.values(items).flat()

  const itemsByStatus = (statusId: string | null) =>
    allItems.filter((it) => {
      if (!statusId) return !it.values?.[statusColumn?.id || ""]
      return it.values?.[statusColumn?.id || ""] === statusId
    })

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {options.map((option) => (
          <div key={option.id} className="min-w-[280px] bg-muted/30 rounded-2xl p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              <h3 className="font-semibold text-sm">{option.name}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {itemsByStatus(option.id).length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {itemsByStatus(option.id).map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  columns={columns}
                  members={members}
                  onClick={() => onItemClick(item)}
                  onStatusChange={(value) =>
                    statusColumn && onStatusChange(item.id, statusColumn.id, value)
                  }
                  onAssigneesChange={(userIds) => onAssigneesChange(item.id, userIds)}
                />
              ))}
              {itemsByStatus(option.id).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No items</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KanbanCard({
  item,
  columns,
  members,
  onClick,
  onStatusChange,
  onAssigneesChange,
}: {
  item: BoardItem
  columns: ColumnDefinition[]
  members: Profile[]
  onClick: () => void
  onStatusChange: (value: string) => void
  onAssigneesChange: (userIds: string[]) => void
}) {
  const statusColumn = columns.find((c) => c.type === "status")
  const priorityColumn = columns.find((c) => c.type === "priority")
  const peopleColumn = columns.find((c) => c.type === "people")
  const dateColumn = columns.find((c) => c.name === "Due Date")
  const priorityValue = priorityColumn ? item.values?.[priorityColumn.id] : item.priority
  const priority = getPriorityOption(priorityValue || "medium")
  const assignees = item.assignees
  const dueDate = dateColumn ? item.values?.[dateColumn.id] : item.due_date

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-border/60 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-[#0A1628]">{item.title}</h4>
        {priority && (
          <Badge className={`border-0 text-xs ${priorityClass(priority.id)}`}>{priority.name}</Badge>
        )}
      </div>

      {statusColumn && (
        <Select
          value={item.values?.[statusColumn.id] || ""}
          onValueChange={(v) => onStatusChange(v)}
        >
          <SelectTrigger className="h-7 text-xs" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(statusColumn.settings?.options || []).map((option: any) => (
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
      )}

      <div className="flex items-center justify-between">
        {peopleColumn && (
          <Select
            value={assignees?.[0]?.user_id || "none"}
            onValueChange={(v) => onAssigneesChange(v === "none" ? [] : [v])}
          >
            <SelectTrigger className="h-7 text-xs w-28" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <SelectValue placeholder="Owner" />
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
        )}

        {dueDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {assignees.length > 0 && (
        <div className="flex -space-x-2">
          {assignees.map((a) => (
            <Avatar key={a.user_id} className="h-6 w-6 border border-white bg-[#0A1628]">
              <AvatarFallback className="text-[10px] bg-[#0A1628] text-white">
                {initials(a.profiles.full_name || a.profiles.email)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
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
