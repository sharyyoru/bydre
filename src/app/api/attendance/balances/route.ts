import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember } from "../_helpers"
import { LeaveBalance, LeaveType } from "@/lib/attendance/types"

/**
 * GET — leave balances for the current user (or ?user_id= for admins).
 * remaining = quota + adjustments - approved days (current calendar year).
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const workspaceId = sp.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const targetUser = auth.role === "admin" && sp.get("user_id") ? (sp.get("user_id") as string) : auth.userId

  const supabase = await createClient()
  const year = new Date().getFullYear()
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const [{ data: types }, { data: approved }, { data: adjustments }] = await Promise.all([
    supabase.from("leave_types").select("*").eq("workspace_id", workspaceId).eq("active", true).order("position"),
    supabase
      .from("leave_requests")
      .select("leave_type_id, days")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUser)
      .eq("status", "approved")
      .gte("start_date", yearStart)
      .lte("start_date", yearEnd),
    supabase
      .from("leave_adjustments")
      .select("leave_type_id, days")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUser),
  ])

  const usedByType = new Map<string, number>()
  for (const r of (approved || []) as { leave_type_id: string; days: number }[]) {
    usedByType.set(r.leave_type_id, (usedByType.get(r.leave_type_id) || 0) + Number(r.days))
  }
  const adjByType = new Map<string, number>()
  for (const a of (adjustments || []) as { leave_type_id: string; days: number }[]) {
    adjByType.set(a.leave_type_id, (adjByType.get(a.leave_type_id) || 0) + Number(a.days))
  }

  const balances: LeaveBalance[] = ((types || []) as LeaveType[]).map((t) => {
    const used = usedByType.get(t.id) || 0
    const adj = adjByType.get(t.id) || 0
    return {
      leave_type_id: t.id,
      name: t.name,
      code: t.code,
      color: t.color,
      quota: Number(t.annual_quota),
      adjustments: adj,
      used,
      remaining: Number(t.annual_quota) + adj - used,
    }
  })

  return NextResponse.json({ balances, year })
}
