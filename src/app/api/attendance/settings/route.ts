import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateSettings, requireWorkspaceAdmin, requireWorkspaceMember } from "../_helpers"

/** GET — attendance settings for a workspace (members). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const settings = await getOrCreateSettings(workspaceId)
  return NextResponse.json({ settings })
}

/** PUT — update attendance settings (admins). */
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  await getOrCreateSettings(workspaceId) // ensure row exists

  const allowed = [
    "timezone",
    "work_start",
    "work_end",
    "grace_minutes",
    "full_day_minutes",
    "half_day_minutes",
    "weekend_days",
    "require_selfie",
    "capture_geo",
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) if (key in body) update[key] = body[key]

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("attendance_settings")
    .update(update)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
