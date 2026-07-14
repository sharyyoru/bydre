"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Mention, MentionsInput } from "react-mentions"
import {
  ColumnDefinition,
  BoardItem,
  Profile,
} from "@/lib/board/columns"
import { CellEditor } from "./columns/cell-editor"
import { ActivityLog } from "../activity/activity-log"

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: Profile
}

export function ItemDetailDrawer({
  item,
  columns,
  members,
  open,
  onOpenChange,
  onItemChanged,
}: {
  item: BoardItem
  columns: ColumnDefinition[]
  members: Profile[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemChanged?: () => void
}) {
  const [localItem, setLocalItem] = useState<BoardItem>(item)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setLocalItem(item)
  }, [item])

  useEffect(() => {
    const supabase = createClient()
    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(id, email, full_name)")
        .eq("item_id", item.id)
        .order("created_at", { ascending: true })

      const typed = ((data || []) as any[]).map((c: any) => ({
        ...c,
        profiles: c.profiles,
      })) as Comment[]
      setComments(typed)
    }

    fetchComments()

    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id || null)
    }
    getUser()

    const channel = supabase
      .channel(`comments-${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${item.id}`,
        },
        () => fetchComments()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [item.id])

  const updateField = async (field: keyof BoardItem, value: any) => {
    const supabase = createClient()
    setLocalItem((prev) => ({ ...prev, [field]: value } as BoardItem))
    const { error } = await supabase
      .from("items")
      .update({ [field]: value } as any)
      .eq("id", item.id)
    if (error) toast.error("Failed to update")
  }

  const updateItemValue = async (columnId: string, value: any) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("item_values")
      .upsert({ item_id: item.id, column_id: columnId, value }, { onConflict: "item_id, column_id" })
    if (error) {
      toast.error("Failed to update value")
      return
    }
    setLocalItem((current) => ({
      ...current,
      values: { ...current.values, [columnId]: value },
    }))
    onItemChanged?.()
  }

  const updateAssignees = async (userIds: string[]) => {
    const supabase = createClient()
    const { error: deleteError } = await supabase.from("item_assignees").delete().eq("item_id", item.id)
    const { error: insertError } = userIds.length > 0
      ? await supabase.from("item_assignees").insert(userIds.map((user_id) => ({ item_id: item.id, user_id })))
      : { error: null }
    if (deleteError || insertError) {
      toast.error("Failed to update assignees")
      return
    }
    setLocalItem((current) => ({
      ...current,
      assignees: members.filter((member) => userIds.includes(member.id)).map((member) => ({ user_id: member.id, profiles: member })),
    }))
    onItemChanged?.()
  }

  const handleCellChange = (column: ColumnDefinition, value: any) => {
    if (column.type === "people") {
      updateAssignees(value || [])
    } else {
      updateItemValue(column.id, value)
    }
  }

  const addComment = async () => {
    if (!commentText.trim() || !userId) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("comments").insert({
      item_id: item.id,
      user_id: userId,
      content: commentText,
    })
    if (error) {
      toast.error("Failed to post comment")
    } else {
      setCommentText("")
    }
    setLoading(false)
  }

  const renderComment = (text: string) => {
    const parts = text.split(/(@\[[^\]]+\]\([^\)]+\))/g)
    return parts.map((part, index) => {
      const match = part.match(/^@\[([^\]]+)\]\([^\)]+\)$/)
      return match ? <span key={index} className="rounded bg-[#D4AF37]/20 px-1 font-medium text-[#0A1628]">@{match[1]}</span> : <span key={index}>{part}</span>
    })
  }

  const visibleColumns = columns.filter((c) => c.archived_at === null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/60">
          <SheetTitle className="text-[#0A1628]">Item details</SheetTitle>
          <SheetDescription>
            Update fields and collaborate with comments.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={localItem.title}
              onChange={(e) => setLocalItem((p) => ({ ...p, title: e.target.value }))}
              onBlur={() => updateField("title", localItem.title)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={localItem.description || ""}
              onChange={(e) => setLocalItem((p) => ({ ...p, description: e.target.value }))}
              onBlur={() => updateField("description", localItem.description)}
              placeholder="Add a description..."
            />
          </div>

          <div className="space-y-3">
            {visibleColumns.map((column) => (
              <div key={column.id} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-muted-foreground">{column.name}</label>
                <div className="col-span-2">
                  <CellEditor
                    column={column}
                    item={localItem}
                    members={members}
                    onChange={(value) => handleCellChange(column, value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {!localItem.parent_id && (
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#0A1628]">Sub-items</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const supabase = createClient()
                  const { data: user } = await supabase.auth.getUser()
                  const { data, error } = await supabase.from("items").insert({
                    board_id: item.board_id,
                    group_id: item.group_id,
                    parent_id: item.id,
                    title: "New sub-item",
                    type: item.type,
                    priority: "medium",
                    created_by: user.user?.id,
                    position: 0,
                  }).select().single()
                  if (error || !data) toast.error("Failed to add sub-item")
                  else {
                    setLocalItem((current) => ({ ...current, sub_items: [...(current.sub_items || []), { ...data, values: {}, assignees: [], sub_items: [], comments_count: 0 }] }))
                    onItemChanged?.()
                    toast.success("Sub-item added")
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add sub-item
              </Button>
            </div>
          )}

          {!localItem.parent_id && localItem.sub_items?.length > 0 && (
            <div className="space-y-2">
              {localItem.sub_items.map((subItem) => (
                <div key={subItem.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                  {subItem.title}
                </div>
              ))}
            </div>
          )}

          <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
            <h4 className="font-semibold text-[#0A1628]">Comments</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-[#0A1628]">
                    <AvatarFallback className="bg-[#0A1628] text-white text-xs">
                      {initials(comment.profiles?.full_name || comment.profiles?.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {comment.profiles?.full_name || comment.profiles?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{renderComment(comment.content)}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No comments yet. Use @email to mention a teammate.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <MentionsInput
                value={commentText}
                onChange={(_, value) => setCommentText(value)}
                placeholder="Write a comment... Type @ to mention a teammate"
                className="mentions-input"
                style={{
                  control: { minHeight: 80, fontSize: 14 },
                  highlighter: { padding: 12, border: "1px solid transparent" },
                  input: { padding: 12, border: "1px solid hsl(var(--border))", borderRadius: 8, outline: "none" },
                  suggestions: { list: { backgroundColor: "white", border: "1px solid hsl(var(--border))", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,.12)", overflow: "hidden" }, item: { padding: "8px 12px", borderBottom: "1px solid hsl(var(--border))" } },
                }}
              >
                <Mention
                  trigger="@"
                  data={members.map((member) => ({ id: member.id, display: member.full_name || member.email }))}
                  markup="@[__display__](__id__)"
                  displayTransform={(_, display) => `@${display}`}
                  style={{ backgroundColor: "rgba(212,175,55,.25)", color: "#0A1628", fontWeight: 600 }}
                />
              </MentionsInput>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Mention with @wilson@drehomes.com
                </span>
                <Button
                  size="sm"
                  onClick={addComment}
                  disabled={loading || !commentText.trim()}
                  className="bg-[#0A1628]"
                >
                  {loading ? "Posting..." : "Post comment"}
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4">
            <h4 className="font-semibold text-[#0A1628] mb-4">Activity</h4>
            <ActivityLog itemId={item.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
