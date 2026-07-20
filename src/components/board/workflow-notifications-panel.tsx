"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, X } from "lucide-react"
import { acknowledgeNotification, getNotificationMessage } from "@/lib/workflow-notifications"

type WorkflowNotification = {
  id: string
  item_id: string
  notification_type: "assign_shooter" | "assign_editor" | "assign_reviewer"
  status: "pending" | "acknowledged" | "completed"
  created_at: string
  items?: {
    id: string
    title: string
    board_id: string
  }
}

export function WorkflowNotificationsPanel({
  workspaceId,
  boardId,
}: {
  workspaceId: string
  boardId?: string
}) {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [workspaceId])

  const fetchNotifications = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("workflow_notifications")
      .select(`
        id,
        item_id,
        notification_type,
        status,
        created_at,
        items(id, title, board_id)
      `)
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setNotifications(
        (data as any[]).map((n) => ({
          id: n.id,
          item_id: n.item_id,
          notification_type: n.notification_type,
          status: n.status,
          created_at: n.created_at,
          items: Array.isArray(n.items) ? n.items[0] : n.items,
        }))
      )
    }
    setLoading(false)
  }

  const handleAcknowledge = async (notificationId: string) => {
    await acknowledgeNotification(notificationId)
    setNotifications(notifications.filter(n => n.id !== notificationId))
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground">Loading notifications...</div>
  }

  const filteredNotifications = boardId
    ? notifications.filter(n => n.items?.board_id === boardId)
    : notifications

  if (filteredNotifications.length === 0) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-sm text-orange-900">
            Workflow Actions Required ({filteredNotifications.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-start justify-between gap-2 rounded-lg bg-white p-2 border border-orange-100"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#0A1628]">
                {notification.items?.title || "Unknown item"}
              </p>
              <p className="text-xs text-muted-foreground">
                {getNotificationMessage(notification.notification_type)}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Link
                href={`/workspace/${workspaceId}/board/${notification.items?.board_id}?item=${notification.item_id}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  View
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAcknowledge(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
