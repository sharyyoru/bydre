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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

type Status = { id: string; name: string; color: string }
type Profile = { id: string; email: string; full_name: string | null }
type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: Profile
}
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
  assignees: { user_id: string; profiles: Profile }[]
}

export function ItemDetailDrawer({
  item,
  statuses,
  open,
  onOpenChange,
}: {
  item: Item
  statuses: Status[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [localItem, setLocalItem] = useState<Item>(item)
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

  const updateField = async (field: keyof Item, value: any) => {
    const supabase = createClient()
    setLocalItem((prev) => ({ ...prev, [field]: value } as Item))
    const { error } = await supabase
      .from("items")
      .update({ [field]: value } as any)
      .eq("id", item.id)
    if (error) toast.error("Failed to update")
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

  const mentionRegex = /@([^\s]+)/g
  const renderComment = (text: string) => {
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
              onChange={(e) => {
                setLocalItem((p) => ({ ...p, title: e.target.value }))
              }}
              onBlur={() => updateField("title", localItem.title)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={localItem.description || ""}
              onChange={(e) =>
                setLocalItem((p) => ({ ...p, description: e.target.value }))
              }
              onBlur={() => updateField("description", localItem.description)}
              placeholder="Add a description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={localItem.status_id || undefined}
                onValueChange={(value) => updateField("status_id", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={localItem.priority}
                onValueChange={(value) =>
                  updateField("priority", value as Item["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <SelectItem key={p} value={p}>
                      <Badge
                        variant="outline"
                        className={`capitalize ${priorityColor(p)} border-0`}
                      >
                        {p}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start date</label>
              <Input
                type="date"
                value={localItem.start_date || ""}
                onChange={(e) => updateField("start_date", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due date</label>
              <Input
                type="date"
                value={localItem.due_date || ""}
                onChange={(e) => updateField("due_date", e.target.value || null)}
              />
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
            <h4 className="font-semibold text-[#0A1628]">Comments</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-[#0A1628]">
                    <AvatarFallback className="bg-[#0A1628] text-white text-xs">
                      {(comment.profiles?.full_name || comment.profiles?.email || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
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
                    <p className="text-sm text-foreground">
                      {renderComment(comment.content)}
                    </p>
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
