import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceAdmin, requireWorkspaceMember } from "../_helpers"

/** GET — holidays (members). Optional ?year=YYYY. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const workspaceId = sp.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  let query = supabase
    .from("holidays")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("holiday_date", { ascending: true })

  const year = sp.get("year")
  if (year) query = query.gte("holiday_date", `${year}-01-01`).lte("holiday_date", `${year}-12-31`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holidays: data })
}

/** POST — add a holiday (admin). Body: { workspace_id, name, holiday_date } */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId || !body.name || !body.holiday_date) {
    return NextResponse.json({ error: "workspace_id, name, holiday_date required" }, { status: 400 })
  }
  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("holidays")
    .upsert(
      { workspace_id: workspaceId, name: body.name, holiday_date: body.holiday_date },
      { onConflict: "workspace_id,holiday_date" }
    )
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holiday: data }, { status: 201 })
}

/** DELETE — remove a holiday (admin). Body: { workspace_id, id } */
export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  const id = String(body.id || "")
  if (!workspaceId || !id) return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })

  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { error } = await supabase.from("holidays").delete().eq("id", id).eq("workspace_id", workspaceId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
