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
import {
  ColumnDefinition,
  BoardItem,
  Profile,
} from "@/lib/board/columns"
import { CellEditor } from "./columns/cell-editor"

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
}: {
  item: BoardItem
  columns: ColumnDefinition[]
  members: Profile[]
  open: boolean
  onOpenChange: (open: boolean) => void
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
    if (error) toast.error("Failed to update value")
  }

  const updateAssignees = async (userIds: string[]) => {
    const supabase = createClient()
    await supabase.from("item_assignees").delete().eq("item_id", item.id)
    if (userIds.length > 0) {
      await supabase
        .from("item_assignees")
        .insert(userIds.map((user_id) => ({ item_id: item.id, user_id })))
    }
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
    const mentionRegex = /@([^\s]+)/g
    const parts = text.split(mentionRegex)
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} className="text-[#D4AF37] font-medium">
          @{part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
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
                  const { error } = await supabase.from("items").insert({
                    board_id: item.board_id,
                    group_id: item.group_id,
                    parent_id: item.id,
                    title: "New sub-item",
                    type: item.type,
                    priority: "medium",
                    created_by: user.user?.id,
                    position: 0,
                  })
                  if (error) toast.error("Failed to add sub-item")
                  else toast.success("Sub-item added")
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add sub-item
              </Button>
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
              <Textarea
                placeholder="Write a comment... Use @email to mention someone"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px]"
              />
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
