import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateSettings, requireWorkspaceMember } from "../_helpers"
import { localDateInTz, minutesBetween } from "@/lib/attendance/logic"

/** POST — toggle break. Body: { workspace_id, action: 'start' | 'stop' } */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  const action = body.action === "stop" ? "stop" : "start"
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const settings = await getOrCreateSettings(workspaceId)
  const now = new Date()
  const today = localDateInTz(now, settings.timezone)

  const supabase = await createClient()
  const { data: record } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", auth.userId)
    .eq("work_date", today)
    .maybeSingle()

  if (!record?.check_in_at) {
    return NextResponse.json({ error: "You have not checked in today", code: "not_checked_in" }, { status: 400 })
  }
  if (record.check_out_at) {
    return NextResponse.json({ error: "Already checked out", code: "already_checked_out" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (action === "start") {
    if (record.break_started_at) return NextResponse.json({ error: "Break already running" }, { status: 400 })
    update.break_started_at = now.toISOString()
  } else {
    if (!record.break_started_at) return NextResponse.json({ error: "No break running" }, { status: 400 })
    update.break_minutes = (record.break_minutes || 0) + minutesBetween(record.break_started_at, now.toISOString())
    update.break_started_at = null
  }

  const { data, error } = await supabase
    .from("attendance_records")
    .update(update)
    .eq("id", record.id)
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}
