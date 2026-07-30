import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateSettings, requireWorkspaceMember } from "../_helpers"
import { deriveStatus, localDateInTz } from "@/lib/attendance/logic"
import { uploadSelfie } from "@/lib/attendance/storage"

/** POST — check in for today. Body: { workspace_id, lat?, lng?, photo? } */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const settings = await getOrCreateSettings(workspaceId)
  const now = new Date()
  const today = localDateInTz(now, settings.timezone)

  if (settings.require_selfie && !body.photo) {
    return NextResponse.json({ error: "A selfie is required to check in", code: "selfie_required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", auth.userId)
    .eq("work_date", today)
    .maybeSingle()

  if (existing?.check_in_at) {
    return NextResponse.json({ error: "Already checked in today", code: "already_checked_in" }, { status: 400 })
  }

  let photoPath: string | null = null
  if (body.photo) {
    try {
      photoPath = await uploadSelfie(workspaceId, auth.userId, today, "in", body.photo)
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Selfie upload failed" }, { status: 500 })
    }
  }

  const status = deriveStatus({ checkInAt: now.toISOString(), workedMinutes: null, settings })
  const payload = {
    workspace_id: workspaceId,
    user_id: auth.userId,
    work_date: today,
    check_in_at: now.toISOString(),
    check_in_lat: body.lat ?? null,
    check_in_lng: body.lng ?? null,
    check_in_photo_path: photoPath,
    status,
  }

  const { data, error } = existing
    ? await supabase.from("attendance_records").update(payload).eq("id", existing.id).select("*").single()
    : await supabase.from("attendance_records").insert(payload).select("*").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}
