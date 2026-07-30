import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateSettings, requireWorkspaceMember } from "../_helpers"
import { localDateInTz } from "@/lib/attendance/logic"

/**
 * GET — attendance records. Members see their own; admins may pass user_id or
 * scope=all. Query: workspace_id, from?, to?, user_id?, scope?
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const workspaceId = sp.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error
  const isAdmin = auth.role === "admin"

  const settings = await getOrCreateSettings(workspaceId)
  const today = localDateInTz(new Date(), settings.timezone)
  const from = sp.get("from") || today
  const to = sp.get("to") || today

  const supabase = await createClient()
  let query = supabase
    .from("attendance_records")
    .select("*, user:profiles(id, full_name, email, avatar_url)")
    .eq("workspace_id", workspaceId)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date", { ascending: false })

  const scope = sp.get("scope")
  const userId = sp.get("user_id")
  if (isAdmin && scope === "all") {
    // all users
  } else if (isAdmin && userId) {
    query = query.eq("user_id", userId)
  } else {
    query = query.eq("user_id", auth.userId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ records: data, today })
}
