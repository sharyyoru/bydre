"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Calendar as CalendarIcon, ChevronDown, ChevronRight, LayoutGrid, Table as TableIcon, History, Trash2 } from "lucide-react"
import {
  ColumnDefinition,
  BoardItem,
  BoardGroup,
  Profile,
} from "@/lib/board/columns"
import { ColumnDefinitionDialog } from "./columns/column-definition-dialog"
import { ItemDetailDrawer } from "./item-detail-drawer"
import { ItemRowTwoLine } from "./item-row-two-line"
import { WorkflowNotificationsPanel } from "./workflow-notifications-panel"
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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Board = {
  id: string
  name: string
  type: "shoots" | "content" | "tasks"
  workspace_id: string
  default_view: string
}

export function BoardView({ workspaceId, board }: { workspaceId: string; board: Board }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
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
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [visibleGroupIds, setVisibleGroupIds] = useState<string[]>(() => searchParams.get("group") ? [searchParams.get("group")!] : [])
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "")
  const [dateRange, setDateRange] = useState(() => searchParams.get("date") || "any")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => searchParams.get("status")?.split(",").filter(Boolean) || [])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(() => searchParams.get("priority")?.split(",").filter(Boolean) || [])
  const [selectedOwners, setSelectedOwners] = useState<string[]>(() => searchParams.get("owner")?.split(",").filter(Boolean) || [])
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>(() => searchParams.get("approval")?.split(",").filter(Boolean) || [])
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupsPage, setGroupsPage] = useState(() => Math.max(1, Number(searchParams.get("groupsPage")) || 1))
  const GROUPS_PER_PAGE = 5
  const ITEMS_PER_BATCH = 20
  const [visibleItemCounts, setVisibleItemCounts] = useState<Record<string, number>>({})
  const showMoreItems = (groupId: string) => setVisibleItemCounts((current) => ({ ...current, [groupId]: (current[groupId] || ITEMS_PER_BATCH) + ITEMS_PER_BATCH }))

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
        if (requestedItem) {
          setSelectedItem(requestedItem)
        } else {
          const nextParams = new URLSearchParams(searchParams.toString())
          nextParams.delete("item")
          router.replace(nextParams.size ? `${pathname}?${nextParams}` : pathname)
        }
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
      const errorMessage = error.message || "Failed to update value"
      toast.error(errorMessage)
      console.error("Update value error:", error)
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

  const updateFilterUrl = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search)
    if (!value || value === "all" || value === "any") next.delete(key); else next.set(key, value)
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`)
  }
  const toggleMultiFilter = (key: "status" | "priority" | "owner" | "approval", value: string, selected: string[], setSelected: (next: string[]) => void) => {
    const next = selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]
    setSelected(next)
    updateFilterUrl(key, next.join(","))
  }
  const visibleColumns = columns.filter((c) => c.archived_at === null)
  const statusColumn = visibleColumns.find((column) => column.type === "status")
  const statusOptions = ((statusColumn?.settings as { options?: { id: string; name: string; color?: string }[] } | null)?.options || [])
  const approvalColumn = visibleColumns.find((column) => column.name === "Approval")
  const approvalOptions = ((approvalColumn?.settings as { options?: { id: string; name: string; color?: string }[] } | null)?.options || [])
  const displayedGroups = visibleGroupIds.length ? groups.filter((group) => visibleGroupIds.includes(group.id)) : groups
  const totalGroupPages = Math.max(1, Math.ceil(displayedGroups.length / GROUPS_PER_PAGE))
  const currentGroupPage = Math.min(groupsPage, totalGroupPages)
  const pagedGroups = displayedGroups.length > GROUPS_PER_PAGE ? displayedGroups.slice((currentGroupPage - 1) * GROUPS_PER_PAGE, currentGroupPage * GROUPS_PER_PAGE) : displayedGroups
  const changeGroupPage = (page: number) => {
    const next = Math.min(Math.max(1, page), totalGroupPages)
    setGroupsPage(next)
    updateFilterUrl("groupsPage", next > 1 ? String(next) : "")
  }
  const filteredItems = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)
    const dateColumns = visibleColumns.filter((column) => column.type === "date")
    const matches = (item: BoardItem) => {
      const haystack = [item.title, item.description, ...Object.values(item.values || {}).map(String), ...item.assignees.map((assignee) => `${assignee.profiles.full_name || ""} ${assignee.profiles.email}`)].join(" ").toLowerCase()
      if (searchQuery && !haystack.includes(searchQuery.toLowerCase())) return false
      if (selectedStatuses.length && (!statusColumn || !selectedStatuses.includes(String(item.values?.[statusColumn.id] || "")))) return false
      if (selectedPriorities.length && !selectedPriorities.includes(item.priority)) return false
      if (selectedOwners.length) {
        const ownerIds = item.assignees.map((assignee) => assignee.user_id)
        const matchesOwner = selectedOwners.some((owner) => owner === "unassigned" ? ownerIds.length === 0 : ownerIds.includes(owner))
        if (!matchesOwner) return false
      }
      if (selectedApprovals.length && approvalColumn) {
        const itemApproval = String(item.values?.[approvalColumn.id] || "")
        if (!selectedApprovals.includes(itemApproval)) return false
      }
      const dates = [item.due_date, ...dateColumns.map((column) => item.values?.[column.id])].filter(Boolean).map((value) => new Date(`${value}T00:00:00`))
      if (dateRange === "no-date") return dates.length === 0
      if (dateRange === "any") return true
      return dates.some((date) => dateRange === "overdue" ? date < today : dateRange === "today" ? date.getTime() === today.getTime() : dateRange === "tomorrow" ? date.getTime() === tomorrow.getTime() : date >= today && date <= weekEnd)
    }
    return Object.fromEntries(Object.entries(items).map(([groupId, groupItems]) => [groupId, groupItems.filter(matches).map((item) => ({ ...item, sub_items: item.sub_items.filter(matches) }))])) as Record<string, BoardItem[]>
  }, [items, searchQuery, dateRange, selectedStatuses, selectedPriorities, selectedOwners, selectedApprovals, statusColumn, approvalColumn, visibleColumns])
  const toggleGroup = (groupId: string) => setCollapsedGroups((current) => current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId])

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#0A1628]">{board.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{board.type} board</p>
            </div>
            <div className="flex bg-muted rounded-lg p-1">
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <Input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); updateFilterUrl("q", event.target.value) }} placeholder="Search this board" className="h-9 w-44" />
              <select value={dateRange} onChange={(event) => { setDateRange(event.target.value); updateFilterUrl("date", event.target.value) }} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="any">Any date</option><option value="no-date">No date</option><option value="overdue">Overdue</option><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="week">Next 7 days</option></select>
              <select value={visibleGroupIds[0] || "all"} onChange={(event) => { const value = event.target.value; setVisibleGroupIds(value === "all" ? [] : [value]); updateFilterUrl("group", value) }} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="all">All groups</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
              {statusColumn && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Status{selectedStatuses.length ? ` (${selectedStatuses.length})` : ""}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Filter status</DropdownMenuLabel><DropdownMenuSeparator />{statusOptions.map((option) => <DropdownMenuCheckboxItem key={option.id} checked={selectedStatuses.includes(option.id)} onCheckedChange={() => toggleMultiFilter("status", option.id, selectedStatuses, setSelectedStatuses)}><span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: option.color || "#6B7280" }} />{option.name}</DropdownMenuCheckboxItem>)}{selectedStatuses.length > 0 && <><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onSelect={(event) => { event.preventDefault(); setSelectedStatuses([]); updateFilterUrl("status", "") }}>Clear status filters</DropdownMenuCheckboxItem></>}</DropdownMenuContent></DropdownMenu>}
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Priority{selectedPriorities.length ? ` (${selectedPriorities.length})` : ""}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Filter priority</DropdownMenuLabel><DropdownMenuSeparator />{["low", "medium", "high", "urgent"].map((priority) => <DropdownMenuCheckboxItem key={priority} checked={selectedPriorities.includes(priority)} onCheckedChange={() => toggleMultiFilter("priority", priority, selectedPriorities, setSelectedPriorities)} className="capitalize">{priority}</DropdownMenuCheckboxItem>)}{selectedPriorities.length > 0 && <><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onSelect={(event) => { event.preventDefault(); setSelectedPriorities([]); updateFilterUrl("priority", "") }}>Clear priority filters</DropdownMenuCheckboxItem></>}</DropdownMenuContent></DropdownMenu>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Owner{selectedOwners.length ? ` (${selectedOwners.length})` : ""}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="max-h-80 overflow-y-auto"><DropdownMenuLabel>Filter owner</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={selectedOwners.includes("unassigned")} onCheckedChange={() => toggleMultiFilter("owner", "unassigned", selectedOwners, setSelectedOwners)}>Unassigned</DropdownMenuCheckboxItem>{members.map((member) => <DropdownMenuCheckboxItem key={member.id} checked={selectedOwners.includes(member.id)} onCheckedChange={() => toggleMultiFilter("owner", member.id, selectedOwners, setSelectedOwners)}>{member.full_name || member.email}</DropdownMenuCheckboxItem>)}{selectedOwners.length > 0 && <><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onSelect={(event) => { event.preventDefault(); setSelectedOwners([]); updateFilterUrl("owner", "") }}>Clear owner filters</DropdownMenuCheckboxItem></>}</DropdownMenuContent></DropdownMenu>
              {approvalColumn && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Approval{selectedApprovals.length ? ` (${selectedApprovals.length})` : ""}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Filter approval</DropdownMenuLabel><DropdownMenuSeparator />{approvalOptions.map((option) => <DropdownMenuCheckboxItem key={option.id} checked={selectedApprovals.includes(option.id)} onCheckedChange={() => toggleMultiFilter("approval", option.id, selectedApprovals, setSelectedApprovals)}><span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: option.color || "#6B7280" }} />{option.name}</DropdownMenuCheckboxItem>)}{selectedApprovals.length > 0 && <><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onSelect={(event) => { event.preventDefault(); setSelectedApprovals([]); updateFilterUrl("approval", "") }}>Clear approval filters</DropdownMenuCheckboxItem></>}</DropdownMenuContent></DropdownMenu>}
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
              <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="bg-[#0A1628]"><Plus className="h-4 w-4 mr-1" />New group</Button></DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader><DialogTitle>Create group</DialogTitle></DialogHeader>
                  <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); await addGroup(); setGroupDialogOpen(false) }}>
                    <div className="space-y-2">
                      <label htmlFor="new-group-name" className="text-sm font-medium">Group name</label>
                      <Input id="new-group-name" autoFocus placeholder="e.g. This Week" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={!newGroupName.trim()} className="bg-[#0A1628]">Create group</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
        </div>

        {activeView === "table" && (
          <div className="space-y-6">
          <WorkflowNotificationsPanel workspaceId={workspaceId} boardId={board.id} />
          {displayedGroups.length > GROUPS_PER_PAGE && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-4 py-2">
              <p className="text-sm text-muted-foreground">Showing groups {(currentGroupPage - 1) * GROUPS_PER_PAGE + 1}–{Math.min(currentGroupPage * GROUPS_PER_PAGE, displayedGroups.length)} of {displayedGroups.length}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => changeGroupPage(currentGroupPage - 1)} disabled={currentGroupPage <= 1}>Previous</Button>
                <span className="text-sm text-muted-foreground" aria-live="polite">Page {currentGroupPage} of {totalGroupPages}</span>
                <Button variant="outline" size="sm" onClick={() => changeGroupPage(currentGroupPage + 1)} disabled={currentGroupPage >= totalGroupPages}>Next</Button>
              </div>
            </div>
          )}
          {pagedGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div
                className="px-4 py-3 flex items-center gap-3 border-b border-border/60"
                style={{ borderLeftWidth: 4, borderLeftColor: group.color }}
              >
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleGroup(group.id)}>{collapsedGroups.includes(group.id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
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

              {!collapsedGroups.includes(group.id) && <div>
                <table className="w-full text-sm">
                  <tbody>
                    {(filteredItems[group.id] || []).slice(0, visibleItemCounts[group.id] || ITEMS_PER_BATCH).map((item, itemIndex) => (
                      <Fragment key={item.id}>
                        <ItemRowTwoLine
                          item={item}
                          visibleColumns={visibleColumns}
                          members={members}
                          totalColumns={1}
                          onTitleChange={(title) => updateItemTitle(item.id, title)}
                          onCellChange={(columnId, value) => handleCellChange(item, visibleColumns.find(c => c.id === columnId)!, value)}
                          onViewClick={() => setSelectedItem(item)}
                          rowIndex={itemIndex}
                        />
                        {item.sub_items?.map((sub) => (
                          <ItemRowTwoLine
                            key={sub.id}
                            item={sub}
                            visibleColumns={visibleColumns}
                            members={members}
                            totalColumns={1}
                            isSubItem
                            onTitleChange={(title) => updateItemTitle(sub.id, title)}
                            onCellChange={(columnId, value) => handleCellChange(sub, visibleColumns.find(c => c.id === columnId)!, value)}
                            onViewClick={() => setSelectedItem(sub)}
                            rowIndex={itemIndex}
                          />
                        ))}
                      </Fragment>
                    ))}
                    {(filteredItems[group.id] || []).length === 0 && (
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
                {(filteredItems[group.id] || []).length > (visibleItemCounts[group.id] || ITEMS_PER_BATCH) && (
                  <div className="flex items-center justify-between border-t border-border/40 bg-muted/10 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Showing {Math.min(visibleItemCounts[group.id] || ITEMS_PER_BATCH, (filteredItems[group.id] || []).length)} of {(filteredItems[group.id] || []).length} items</p>
                    <Button variant="outline" size="sm" onClick={() => showMoreItems(group.id)}>Show {Math.min(ITEMS_PER_BATCH, (filteredItems[group.id] || []).length - (visibleItemCounts[group.id] || ITEMS_PER_BATCH))} more</Button>
                  </div>
                )}
              </div>}
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
            items={filteredItems}
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
              const nextParams = new URLSearchParams(searchParams.toString())
              nextParams.delete("item")
              router.replace(nextParams.size ? `${pathname}?${nextParams}` : pathname)
              fetchAll()
            }
          }}
          onItemChanged={fetchAll}
        />
      )}
    </AppShell>
  )
}
