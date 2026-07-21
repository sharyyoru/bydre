import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceAdmin } from "../_helpers"

/**
 * POST — enqueue a brief for distribution (and mark brief scheduled).
 * Body: { workspace_id, brief_id, platform, scheduled_at? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, brief_id, platform, scheduled_at } = body
    if (!workspace_id || !brief_id || !platform) {
      return NextResponse.json(
        { error: "workspace_id, brief_id, platform required" },
        { status: 400 }
      )
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("distribution_queue")
      .insert({
        workspace_id,
        brief_id,
        platform,
        scheduled_at: scheduled_at || null,
        status: "queued",
        payload: {},
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase
      .from("content_briefs")
      .update({ status: "scheduled" })
      .eq("id", brief_id)
      .eq("workspace_id", workspace_id)

    return NextResponse.json({ entry: data }, { status: 201 })
  } catch (err) {
    console.error("distribution POST error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/** PATCH — update a distribution entry status/external IDs. */
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
    for (const f of ["status", "external_id", "external_url", "error", "published_at", "scheduled_at"]) {
      if (f in updates) allowed[f] = updates[f]
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("distribution_queue")
      .update(allowed)
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entry: data })
  } catch (err) {
    console.error("distribution PATCH error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
