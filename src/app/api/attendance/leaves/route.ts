import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getHolidaySet, getOrCreateSettings, requireWorkspaceMember } from "../_helpers"
import { countLeaveDays, enumerateDates, isWorkingDay } from "@/lib/attendance/logic"

const SELECT = "*, leave_type:leave_types(id, name, code, color, paid), user:profiles(id, full_name, email, avatar_url)"

/** GET — leave requests. Members see own; admins can pass scope=all / status. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const workspaceId = sp.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error
  const isAdmin = auth.role === "admin"

  const supabase = await createClient()
  let query = supabase
    .from("leave_requests")
    .select(SELECT)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  const status = sp.get("status")
  if (status) query = query.eq("status", status)

  if (!(isAdmin && sp.get("scope") === "all")) {
    if (isAdmin && sp.get("user_id")) query = query.eq("user_id", sp.get("user_id") as string)
    else query = query.eq("user_id", auth.userId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

/** POST — apply for leave (member). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId || !body.leave_type_id || !body.start_date || !body.end_date) {
    return NextResponse.json({ error: "workspace_id, leave_type_id, start_date, end_date required" }, { status: 400 })
  }
  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const settings = await getOrCreateSettings(workspaceId)
  const holidays = await getHolidaySet(workspaceId)
  const portion = ["full", "first_half", "second_half"].includes(body.day_portion) ? body.day_portion : "full"
  const days = countLeaveDays(body.start_date, body.end_date, portion, settings, holidays)
  if (days <= 0) {
    return NextResponse.json({ error: "Selected dates contain no working days" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      workspace_id: workspaceId,
      user_id: auth.userId,
      leave_type_id: body.leave_type_id,
      start_date: body.start_date,
      end_date: body.end_date,
      day_portion: portion,
      days,
      reason: body.reason || null,
    })
    .select(SELECT)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data }, { status: 201 })
}

/**
 * PATCH — approve/reject (admin) or cancel (owner, while pending).
 * Body: { workspace_id, id, action: 'approve'|'reject'|'cancel', review_note? }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  const id = String(body.id || "")
  const action = String(body.action || "")
  if (!workspaceId || !id || !action) {
    return NextResponse.json({ error: "workspace_id, id, action required" }, { status: 400 })
  }

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error
  const isAdmin = auth.role === "admin"

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 })

  if (action === "cancel") {
    if (existing.user_id !== auth.userId && !isAdmin) {
      return NextResponse.json({ error: "Cannot cancel others' requests" }, { status: 403 })
    }
    const { data, error } = await supabase
      .from("leave_requests")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ request: data })
  }

  if (action === "approve" || action === "reject") {
    if (!isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    const status = action === "approve" ? "approved" : "rejected"
    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
        review_note: body.review_note || null,
      })
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // On approval, mark working days as on_leave where no record exists yet.
    if (status === "approved") {
      const settings = await getOrCreateSettings(workspaceId)
      const holidays = await getHolidaySet(workspaceId)
      const rows = enumerateDates(existing.start_date, existing.end_date)
        .filter((d) => isWorkingDay(d, settings, holidays))
        .map((d) => ({
          workspace_id: workspaceId,
          user_id: existing.user_id,
          work_date: d,
          status: "on_leave" as const,
        }))
      if (rows.length) {
        const admin = createAdminClient()
        await admin
          .from("attendance_records")
          .upsert(rows, { onConflict: "workspace_id,user_id,work_date", ignoreDuplicates: true })
      }
    }
    return NextResponse.json({ request: data })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
