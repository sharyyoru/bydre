import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateSettings, requireWorkspaceMember } from "../_helpers"
import { deriveStatus, localDateInTz, minutesBetween } from "@/lib/attendance/logic"
import { uploadSelfie } from "@/lib/attendance/storage"

/** POST — check out for today. Body: { workspace_id, lat?, lng?, photo? } */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
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
    return NextResponse.json({ error: "Already checked out today", code: "already_checked_out" }, { status: 400 })
  }

  // Close any open break.
  let breakMinutes = record.break_minutes || 0
  if (record.break_started_at) {
    breakMinutes += minutesBetween(record.break_started_at, now.toISOString())
  }

  const gross = minutesBetween(record.check_in_at, now.toISOString())
  const workedMinutes = Math.max(0, gross - breakMinutes)
  const status = deriveStatus({ checkInAt: record.check_in_at, workedMinutes, settings })

  let photoPath: string | null = record.check_out_photo_path
  if (body.photo) {
    try {
      photoPath = await uploadSelfie(workspaceId, auth.userId, today, "out", body.photo)
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Selfie upload failed" }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      check_out_at: now.toISOString(),
      check_out_lat: body.lat ?? null,
      check_out_lng: body.lng ?? null,
      check_out_photo_path: photoPath,
      break_minutes: breakMinutes,
      break_started_at: null,
      worked_minutes: workedMinutes,
      status,
    })
    .eq("id", record.id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}
