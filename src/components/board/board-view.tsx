"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
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
import { toast } from "sonner"
import { Plus, Calendar as CalendarIcon, MessageSquare } from "lucide-react"
import { ItemDetailDrawer } from "./item-detail-drawer"

type Group = { id: string; name: string; color: string; position: number }
type Status = { id: string; name: string; color: string }
type Profile = { id: string; email: string; full_name: string | null }
type Assignee = { user_id: string; profiles: Profile }
type Item = {
  id: string
  title: string
  description: string | null
  status_id: string | null
  priority: "low" | "medium" | "high" | "urgent"
  start_date: string | null
  due_date: string | null
  group_id: string
  created_by: string
  comments_count: number
  assignees: Assignee[]
}

type Board = {
  id: string
  name: string
  type: "shoots" | "content" | "tasks"
  workspace_id: string
}

export function BoardView({ workspaceId, board }: { workspaceId: string; board: Board }) {
  const params = useParams()
  const [groups, setGroups] = useState<Group[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [items, setItems] = useState<Record<string, Item[]>>({})
  const [members, setMembers] = useState<Profile[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const fetchAll = useCallback(async () => {
    const supabase = createClient()

    const [{ data: g }, { data: s }, { data: m }] = await Promise.all([
      supabase
        .from("groups")
        .select("id, name, color, position")
        .eq("board_id", board.id)
        .order("position", { ascending: true }),
      supabase
        .from("statuses")
        .select("id, name, color")
        .eq("board_id", board.id)
        .order("position", { ascending: true }),
      supabase
        .from("workspace_members")
        .select("user_id, profiles(id, email, full_name)")
        .eq("workspace_id", workspaceId),
    ])

    setGroups((g as Group[]) || [])
    setStatuses((s as Status[]) || [])
    setMembers(
      ((m || []) as any[]).map((row: any) => ({
        id: row.user_id,
        email: row.profiles?.email || "",
        full_name: row.profiles?.full_name || null,
      }))
    )

    if (g && g.length > 0) {
      const { data: i } = await supabase
        .from("items")
        .select(
          "*, item_assignees(user_id, profiles(id, email, full_name)), comments(count)"
        )
        .eq("board_id", board.id)
        .order("created_at", { ascending: true })

      const typedItems = ((i || []) as any[]).map((item: any) => ({
        ...item,
        assignees: (item.item_assignees || []).map((a: any) => ({
          user_id: a.user_id,
          profiles: a.profiles,
        })),
        comments_count: item.comments?.[0]?.count || 0,
      })) as Item[]

      const byGroup: Record<string, Item[]> = {}
      for (const group of g as Group[]) {
        byGroup[group.id] = typedItems.filter((it) => it.group_id === group.id)
      }
      setItems(byGroup)
    }
  }, [board.id, workspaceId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`board-${board.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `board_id=eq.${board.id}` },
        () => fetchAll()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [board.id, fetchAll])

  const addGroup = async () => {
    if (!newGroupName.trim()) return
    const supabase = createClient()
    const { error } = await supabase.from("groups").insert({
      board_id: board.id,
      name: newGroupName,
      color: "#3B82F6",
      position: groups.length,
    })
    if (error) {
      toast.error("Failed to add group")
      return
    }
    setNewGroupName("")
    fetchAll()
  }

  const addItem = async (groupId: string) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("items")
      .insert({
        board_id: board.id,
        group_id: groupId,
        title: "New item",
        type: board.type.replace(/s$/, "").replace("content", "content") as any,
        priority: "medium",
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to add item")
      return
    }
    setSelectedItem(data as Item)
    fetchAll()
  }

  const updateItem = async (
    itemId: string,
    updates: Partial<Item>
  ) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("items")
      .update(updates as any)
      .eq("id", itemId)
    if (error) {
      toast.error("Failed to update item")
      return
    }
    fetchAll()
  }

  const updateAssignees = async (itemId: string, userIds: string[]) => {
    const supabase = createClient()
    await supabase.from("item_assignees").delete().eq("item_id", itemId)
    if (userIds.length > 0) {
      await supabase
        .from("item_assignees")
        .insert(userIds.map((user_id) => ({ item_id: itemId, user_id })))
    }
    fetchAll()
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case "low":
        return "bg-slate-100 text-slate-700"
      case "medium":
        return "bg-blue-100 text-blue-700"
      case "high":
        return "bg-[#D4AF37]/10 text-[#D4AF37]"
      case "urgent":
        return "bg-red-100 text-red-700"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">{board.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{board.type} board</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/workspace/${params.id}/calendar/${board.id}`}>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Input
                placeholder="New group"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-40"
              />
              <Button size="sm" onClick={addGroup} className="bg-[#0A1628]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div
                className="px-4 py-3 flex items-center gap-3 border-b border-border/60"
                style={{ borderLeftWidth: 4, borderLeftColor: group.color }}
              >
                <h3 className="font-semibold text-[#0A1628]">{group.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {items[group.id]?.length || 0} items
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-[#D4AF37] hover:text-[#D4AF37]/80"
                  onClick={() => addItem(group.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium w-1/3">Item</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-left px-4 py-2 font-medium">Priority</th>
                      <th className="text-left px-4 py-2 font-medium">Assignees</th>
                      <th className="text-left px-4 py-2 font-medium">Due date</th>
                      <th className="text-left px-4 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items[group.id] || []).map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-border/40 hover:bg-muted/20 cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-4 py-3 font-medium text-[#0A1628]">
                          {item.title}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={item.status_id || undefined}
                            onValueChange={(value) =>
                              updateItem(item.id, { status_id: value || null })
                            }
                          >
                            <SelectTrigger className="w-36 h-8">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  <span
                                    className="inline-block w-2 h-2 rounded-full mr-2"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`capitalize ${priorityColor(item.priority)} border-0`}
                          >
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={item.assignees?.[0]?.user_id || "none"}
                            onValueChange={(value) => {
                              const ids = value === "none" ? [] : [value]
                              updateAssignees(item.id, ids)
                            }}
                          >
                            <SelectTrigger className="w-40 h-8" onClick={(e) => e.stopPropagation()}>
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
                        </td>
                        <td className="px-4 py-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {item.due_date
                                  ? format(new Date(item.due_date), "MMM d")
                                  : "Set date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={item.due_date ? new Date(item.due_date) : undefined}
                                onSelect={(date) =>
                                  updateItem(item.id, {
                                    due_date: date
                                      ? format(date, "yyyy-MM-dd")
                                      : null,
                                  })
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-4 py-3">
                          {item.comments_count > 0 && (
                            <div className="flex items-center text-muted-foreground text-xs">
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              {item.comments_count}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(items[group.id] || []).length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-sm text-muted-foreground"
                        >
                          No items yet. Click Add item to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border/60">
              <p className="text-muted-foreground">
                No groups yet. Create your first group to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <ItemDetailDrawer
          item={selectedItem}
          statuses={statuses}
          open={!!selectedItem}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSelectedItem(null)
              fetchAll()
            }
          }}
        />
      )}
    </AppShell>
  )
}
