import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceAdmin, requireWorkspaceMember } from "../_helpers"

/** GET — leave types for a workspace (members). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leave_types")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leave_types: data })
}

/** POST — create a leave type (admin). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId || !body.name || !body.code) {
    return NextResponse.json({ error: "workspace_id, name, code required" }, { status: 400 })
  }
  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leave_types")
    .insert({
      workspace_id: workspaceId,
      name: body.name,
      code: String(body.code).toLowerCase().replace(/\s+/g, "_"),
      color: body.color || "#0A1628",
      annual_quota: body.annual_quota ?? 0,
      paid: body.paid ?? true,
      position: body.position ?? 0,
    })
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leave_type: data }, { status: 201 })
}

/** PATCH — update a leave type (admin). */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  const id = String(body.id || "")
  if (!workspaceId || !id) return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })

  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const allowed = ["name", "color", "annual_quota", "paid", "active", "position"]
  const update: Record<string, unknown> = {}
  for (const key of allowed) if (key in body) update[key] = body[key]

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leave_types")
    .update(update)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leave_type: data })
}

/** DELETE — remove a leave type (admin). Body: { workspace_id, id } */
export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || "")
  const id = String(body.id || "")
  if (!workspaceId || !id) return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })

  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { error } = await supabase.from("leave_types").delete().eq("id", id).eq("workspace_id", workspaceId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
