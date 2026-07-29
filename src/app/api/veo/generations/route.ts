import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"

/** GET — combined image + video generation history (newest first). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("media_generations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generations: data })
}

/** DELETE — remove a generation row (admin only). Body: { workspace_id, id } */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id } = body
    if (!workspace_id || !id) {
      return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { error } = await supabase
      .from("media_generations")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
