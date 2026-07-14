"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Calendar as CalendarIcon, Eye, LayoutGrid, Table as TableIcon, History, Trash2 } from "lucide-react"
import {
  ColumnDefinition,
  BoardItem,
  BoardGroup,
  Profile,
} from "@/lib/board/columns"
import { CellEditor } from "./columns/cell-editor"
import { ColumnDefinitionDialog } from "./columns/column-definition-dialog"
import { ItemDetailDrawer } from "./item-detail-drawer"
import { KanbanView } from "./views/kanban-view"
import { AutomationBuilder } from "../automations/automation-builder"
import { ActivityLog } from "../activity/activity-log"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Board = {
  id: string
  name: string
  type: "shoots" | "content" | "tasks"
  workspace_id: string
  default_view: string
}

export function BoardView({ workspaceId, board }: { workspaceId: string; board: Board }) {
  const params = useParams()
  const searchParams = useSearchParams()
  const requestedItemId = searchParams.get("item")
  const [groups, setGroups] = useState<BoardGroup[]>([])
  const [columns, setColumns] = useState<ColumnDefinition[]>([])
  const [items, setItems] = useState<Record<string, BoardItem[]>>({})
  const [members, setMembers] = useState<Profile[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null)
  const [activeView, setActiveView] = useState("table")

  const fetchAll = useCallback(async () => {
    const supabase = createClient()

    const [{ data: g }, { data: c }, { data: m }, { data: auth }] = await Promise.all([
      supabase
        .from("groups")
        .select("id, name, color, position, archived_at")
        .eq("board_id", board.id)
        .is("archived_at", null)
        .order("position", { ascending: true }),
      supabase
        .from("columns")
        .select("id, board_id, name, type, position, settings, is_required, archived_at, created_at")
        .eq("board_id", board.id)
        .is("archived_at", null)
        .order("position", { ascending: true }),
      supabase
        .from("workspace_members")
        .select("user_id, role, profiles(id, email, full_name)")
        .eq("workspace_id", workspaceId),
      supabase.auth.getUser(),
    ])

    const typedGroups = (g as BoardGroup[]) || []
    const typedColumns = (c as ColumnDefinition[]) || []
    setGroups(typedGroups)
    setColumns(typedColumns)
    setMembers(
      ((m || []) as any[]).map((row: any) => ({
        id: row.user_id,
        email: row.profiles?.email || "",
        full_name: row.profiles?.full_name || null,
      }))
    )
    const currentMember = ((m || []) as any[]).find((row: any) => row.user_id === auth.user?.id)
    setIsAdmin(currentMember?.role === "admin")

    if (typedGroups.length > 0) {
      const { data: i } = await supabase
        .from("items")
        .select(
          "*, item_assignees(user_id, profiles(id, email, full_name)), comments(count), item_values(id, column_id, value)"
        )
        .eq("board_id", board.id)
        .is("archived_at", null)
        .order("position", { ascending: true })

      const parentItemIds = ((i || []) as any[]).map((item: any) => item.id)

      const { data: subData } = parentItemIds.length > 0
        ? await supabase
            .from("items")
            .select(
              "*, item_assignees(user_id, profiles(id, email, full_name)), comments(count), item_values(id, column_id, value)"
            )
            .in("parent_id", parentItemIds)
            .is("archived_at", null)
            .order("position", { ascending: true })
        : { data: [] }

      const buildItem = (item: any): BoardItem => {
        const values: Record<string, any> = {}
        for (const v of item.item_values || []) {
          values[v.column_id] = v.value
        }
        return {
          ...item,
          values,
          assignees: (item.item_assignees || []).map((a: any) => ({
            user_id: a.user_id,
            profiles: a.profiles,
          })),
          comments_count: item.comments?.[0]?.count || 0,
          sub_items: [],
        } as BoardItem
      }

      const allItems = ((i || []) as any[]).map(buildItem)
      const subItems = ((subData || []) as any[]).map(buildItem)

      const subByParent: Record<string, BoardItem[]> = {}
      for (const sub of subItems) {
        const parentId = sub.parent_id as string
        if (!subByParent[parentId]) subByParent[parentId] = []
        subByParent[parentId].push(sub)
      }
      for (const item of allItems) {
        item.sub_items = subByParent[item.id] || []
      }

      const byGroup: Record<string, BoardItem[]> = {}
      for (const group of typedGroups) {
        byGroup[group.id] = allItems.filter((it) => it.group_id === group.id && !it.parent_id)
      }
      setItems(byGroup)
      if (requestedItemId) {
        const requestedItem = [...allItems, ...subItems].find((item) => item.id === requestedItemId)
        if (requestedItem) setSelectedItem(requestedItem)
      }
    }
  }, [board.id, requestedItemId, workspaceId])

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item_values" },
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
        position: 0,
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to add item")
      return
    }
    setSelectedItem(data as BoardItem)
    fetchAll()
  }

  const updateItemValue = async (itemId: string, columnId: string, value: any) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("item_values")
      .upsert({ item_id: itemId, column_id: columnId, value }, { onConflict: "item_id, column_id" })
    if (error) {
      toast.error("Failed to update value")
      return
    }
    fetchAll()
  }

  const updateItemTitle = async (itemId: string, title: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("items").update({ title }).eq("id", itemId)
    if (error) {
      toast.error("Failed to update title")
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

  const handleCellChange = (item: BoardItem, column: ColumnDefinition, value: any) => {
    if (column.type === "people") {
      updateAssignees(item.id, value || [])
    } else {
      updateItemValue(item.id, column.id, value)
    }
  }

  const deleteGroup = async (group: BoardGroup) => {
    if (!window.confirm(`Delete ${group.name}? This permanently deletes every item and sub-item in this group.`)) return
    const supabase = createClient()
    const { error } = await supabase.from("groups").delete().eq("id", group.id)
    if (error) {
      toast.error("Failed to delete group")
      return
    }
    toast.success("Group deleted")
    fetchAll()
  }

  const visibleColumns = columns.filter((c) => c.archived_at === null)

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">{board.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{board.type} board</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1 mr-2">
              <Button
                variant={activeView === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8"
                onClick={() => setActiveView("table")}
              >
                <TableIcon className="h-4 w-4 mr-1" /> Table
              </Button>
              <Button
                variant={activeView === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="h-8"
                onClick={() => setActiveView("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
              </Button>
              <Link href={`/workspace/${params.id}/calendar/${board.id}`}>
                <Button variant="ghost" size="sm" className="h-8">
                  <CalendarIcon className="h-4 w-4 mr-1" /> Calendar
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" size="sm"><History className="h-4 w-4 mr-2" />Activity</Button></DialogTrigger>
                <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Board activity</DialogTitle></DialogHeader><ActivityLog boardId={board.id} /></DialogContent>
              </Dialog>
              <AutomationBuilder boardId={board.id} onChange={fetchAll} />
              <ColumnDefinitionDialog
                boardId={board.id}
                existingColumnCount={visibleColumns.length}
                onSuccess={fetchAll}
              />
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

        {activeView === "table" && (
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
                {isAdmin && <Button variant="ghost" size="sm" onClick={() => deleteGroup(group)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />Delete group
                </Button>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="min-w-[260px] w-[30%] text-left px-4 py-2 font-medium">Item</th>
                      {visibleColumns.map((column) => (
                        <th key={column.id} className="text-left px-4 py-2 font-medium whitespace-nowrap">
                          {column.name}
                        </th>
                      ))}
                      <th className="px-4 py-2" aria-label="View details" />
                    </tr>
                  </thead>
                  <tbody>
                    {(items[group.id] || []).map((item) => (
                      <Fragment key={item.id}>
                        <tr
                          key={item.id}
                          className="border-t border-border/40 hover:bg-muted/20 cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <td className="min-w-[260px] px-4 py-3 font-medium text-[#0A1628]">
                            <Input
                              key={`${item.id}-${item.title}`}
                              defaultValue={item.title}
                              onBlur={(e) => {
                                if (e.target.value !== item.title) updateItemTitle(item.id, e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 w-full min-w-0 border-transparent bg-transparent px-0 hover:bg-white focus:bg-white focus:border-border"
                            />
                          </td>
                          {visibleColumns.map((column) => (
                            <td
                              key={column.id}
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isNotesColumn(column) ? (
                                <NotesPreview value={item.values?.[column.id]} onOpen={() => setSelectedItem(item)} />
                              ) : (
                                <CellEditor
                                  column={column}
                                  item={item}
                                  members={members}
                                  onChange={(value) => handleCellChange(item, column, value)}
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>View</Button></td>
                        </tr>
                        {item.sub_items?.map((sub) => (
                          <tr
                            key={sub.id}
                            className="border-t border-dashed border-border/30 hover:bg-muted/20 cursor-pointer bg-muted/10"
                            onClick={() => setSelectedItem(sub)}
                          >
                            <td className="min-w-[260px] px-4 py-2 pl-10 font-medium text-[#0A1628]">
                              <Input
                                key={`${sub.id}-${sub.title}`}
                                defaultValue={sub.title}
                                onBlur={(e) => {
                                  if (e.target.value !== sub.title) updateItemTitle(sub.id, e.target.value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 w-full min-w-0 border-transparent bg-transparent px-0 hover:bg-white focus:bg-white focus:border-border"
                              />
                            </td>
                            {visibleColumns.map((column) => (
                              <td
                                key={column.id}
                                className="px-4 py-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isNotesColumn(column) ? (
                                  <NotesPreview value={sub.values?.[column.id]} onOpen={() => setSelectedItem(sub)} />
                                ) : (
                                  <CellEditor
                                    column={column}
                                    item={sub}
                                    members={members}
                                    onChange={(value) => handleCellChange(sub, column, value)}
                                  />
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}><Button variant="outline" size="sm" onClick={() => setSelectedItem(sub)}>View</Button></td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                    {(items[group.id] || []).length === 0 && (
                      <tr>
                        <td
                          colSpan={visibleColumns.length + 2}
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
        )}

        {activeView === "kanban" && (
          <KanbanView
            columns={columns}
            items={items}
            members={members}
            onItemClick={setSelectedItem}
            onStatusChange={(itemId: string, columnId: string, value: string) => updateItemValue(itemId, columnId, value)}
            onAssigneesChange={updateAssignees}
          />
        )}
      </div>

      {selectedItem && (
        <ItemDetailDrawer
          item={selectedItem}
          columns={columns}
          members={members}
          open={!!selectedItem}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSelectedItem(null)
              fetchAll()
            }
          }}
          onItemChanged={fetchAll}
        />
      )}
    </AppShell>
  )
}

function isNotesColumn(column: ColumnDefinition) {
  return column.type === "text" && column.name.trim().toLowerCase() === "notes"
}

function NotesPreview({ value, onOpen }: { value: unknown; onOpen: () => void }) {
  const note = typeof value === "string" ? value.trim() : ""
  if (!note) return <Button variant="ghost" size="sm" onClick={onOpen}>Add note</Button>
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onOpen} aria-label="View note"><Eye className="h-4 w-4" /></Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm whitespace-pre-wrap">{note}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
