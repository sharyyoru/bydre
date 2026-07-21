import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceAdmin } from "../_helpers"

/** GET /api/social-monitor/briefs?workspace_id=...  — list briefs (members). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("content_briefs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ briefs: data })
}

/** PATCH /api/social-monitor/briefs — update a brief (admins). */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id, ...updates } = body
    if (!workspace_id || !id) {
      return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const allowed: Record<string, unknown> = {}
    const editableFields = [
      "title",
      "angle",
      "hook",
      "summary",
      "platform_copy",
      "keywords",
      "target_area",
      "status",
    ]
    for (const f of editableFields) {
      if (f in updates) allowed[f] = updates[f]
    }
    if ("status" in allowed) allowed.reviewed_by = auth.userId

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("content_briefs")
      .update(allowed)
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ brief: data })
  } catch (err) {
    console.error("briefs PATCH error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
