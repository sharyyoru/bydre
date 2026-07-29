import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceAdmin } from "../../_helpers"
import { pollVideo } from "@/lib/veo/client"
import { VeoApiError, VeoNotConfiguredError } from "@/lib/veo/types"

export const maxDuration = 60

/**
 * GET — poll a running Veo generation, update its row, return status/result.
 * Query: workspace_id, id
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  const id = request.nextUrl.searchParams.get("id")
  if (!workspaceId || !id) {
    return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })
  }
  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data: gen } = await supabase
    .from("media_generations")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (!gen) return NextResponse.json({ error: "generation not found" }, { status: 404 })

  const row = gen as {
    status: string
    operation_name: string | null
  }
  // Terminal states short-circuit — no need to re-poll Google.
  if (row.status !== "running" || !row.operation_name) {
    return NextResponse.json({ generation: gen })
  }

  try {
    const poll = await pollVideo(workspaceId, row.operation_name)
    if (!poll.done) return NextResponse.json({ generation: gen })

    const update = poll.error
      ? { status: "failed", error: poll.error }
      : { status: "succeeded", result: poll.videos, error: null }

    const { data: updated, error } = await supabase
      .from("media_generations")
      .update(update)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ generation: updated })
  } catch (e) {
    if (e instanceof VeoNotConfiguredError) {
      return NextResponse.json({ error: "Google API key not configured", code: "not_configured" }, { status: 501 })
    }
    const status = e instanceof VeoApiError ? e.status : 502
    return NextResponse.json({ error: e instanceof Error ? e.message : "Poll failed" }, { status })
  }
}
