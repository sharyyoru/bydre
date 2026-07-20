import { createClient } from "@/lib/supabase/client"

export type NotificationType = "assign_shooter" | "assign_editor" | "assign_reviewer"

const NOTIFICATION_MESSAGES: Record<NotificationType, string> = {
  assign_shooter: "Awaiting shooter assignment",
  assign_editor: "Awaiting editor assignment",
  assign_reviewer: "Awaiting reviewer assignment",
}

export async function createWorkflowNotification(
  workspaceId: string,
  itemId: string,
  notificationType: NotificationType
) {
  const supabase = createClient()

  const { error } = await supabase.from("workflow_notifications").insert({
    workspace_id: workspaceId,
    item_id: itemId,
    notification_type: notificationType,
    status: "pending",
  })

  if (error) {
    console.error("Failed to create workflow notification:", error)
    return false
  }

  return true
}

export async function acknowledgeNotification(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("workflow_notifications")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", notificationId)

  if (error) {
    console.error("Failed to acknowledge notification:", error)
    return false
  }

  return true
}

export async function completeNotification(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("workflow_notifications")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", notificationId)

  if (error) {
    console.error("Failed to complete notification:", error)
    return false
  }

  return true
}

export async function getPendingNotifications(workspaceId: string) {
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

  if (error) {
    console.error("Failed to fetch pending notifications:", error)
    return []
  }

  return (data || []) as any[]
}

export function getNotificationMessage(type: NotificationType): string {
  return NOTIFICATION_MESSAGES[type] || "Action required"
}
