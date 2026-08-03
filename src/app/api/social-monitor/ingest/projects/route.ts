import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchGenieMapProjects } from "@/lib/social-monitor/geniemap"
import { NotConfiguredError } from "@/lib/social-monitor/types"
import { requireWorkspaceMember, notConfigured } from "../../_helpers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, filters } = body

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id required" },
        { status: 400 }
      )
    }

    const auth = await requireWorkspaceMember(workspace_id)
    if ("error" in auth) return auth.error

    const rows = await fetchGenieMapProjects({
      workspaceId: workspace_id,
      filters,
    })

    if (!rows.length) {
      return NextResponse.json({ inserted: 0, message: "No projects returned" })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("geniemap_projects")
      .upsert(rows, {
        onConflict: "workspace_id, external_id",
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length })
  } catch (err) {
    if (err instanceof NotConfiguredError) return notConfigured(err.provider)
    console.error("ingest/projects error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
