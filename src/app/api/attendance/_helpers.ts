import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AttendanceSettings } from "@/lib/attendance/types"

type AuthOk = { userId: string; role: string }
type AuthErr = { error: NextResponse }

/** Require the current user to be a member of the workspace. */
export async function requireWorkspaceMember(workspaceId: string): Promise<AuthOk | AuthErr> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) return { error: NextResponse.json({ error: "Not a workspace member" }, { status: 403 }) }
  return { userId: user.id, role: (member as { role: string }).role }
}

/** Require the current user to be an admin of the workspace. */
export async function requireWorkspaceAdmin(workspaceId: string): Promise<AuthOk | AuthErr> {
  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth
  if (auth.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }
  return auth
}

const DEFAULT_LEAVE_TYPES = [
  { name: "Annual Leave", code: "annual", color: "#0A9D58", annual_quota: 21, paid: true, position: 0 },
  { name: "Sick Leave", code: "sick", color: "#E4572E", annual_quota: 10, paid: true, position: 1 },
  { name: "Unpaid Leave", code: "unpaid", color: "#6B7280", annual_quota: 0, paid: false, position: 2 },
]

/**
 * Fetch attendance settings, lazily creating defaults (via service role) for
 * workspaces that predate the seed or were created after the migration.
 */
export async function getOrCreateSettings(workspaceId: string): Promise<AttendanceSettings> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("attendance_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (data) return data as AttendanceSettings

  const admin = createAdminClient()
  const { data: created } = await admin
    .from("attendance_settings")
    .upsert({ workspace_id: workspaceId }, { onConflict: "workspace_id" })
    .select("*")
    .single()
  await admin
    .from("leave_types")
    .upsert(
      DEFAULT_LEAVE_TYPES.map((t) => ({ ...t, workspace_id: workspaceId })),
      { onConflict: "workspace_id,code", ignoreDuplicates: true }
    )
  return created as AttendanceSettings
}

/** Load the set of holiday date strings for a workspace (optionally a year). */
export async function getHolidaySet(workspaceId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("holidays")
    .select("holiday_date")
    .eq("workspace_id", workspaceId)
  return new Set((data || []).map((h: { holiday_date: string }) => h.holiday_date))
}
