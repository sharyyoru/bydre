import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"
import { ACTION_POINTS, AdvocacyAction } from "@/lib/reels/types"

const DEFAULT_ACTIONS: AdvocacyAction[] = ["share_story", "repost"]

/** GET — list campaigns with their post + task progress. Query: workspace_id */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data: campaigns, error } = await supabase
    .from("amplification_campaigns")
    .select("*, social_posts(id, caption, permalink, platform)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (campaigns || []).map((c: { id: string }) => c.id)
  const progress: Record<string, { total: number; done: number }> = {}
  if (ids.length) {
    const { data: tasks } = await supabase
      .from("advocacy_tasks")
      .select("campaign_id, status")
      .in("campaign_id", ids)
    for (const t of (tasks || []) as { campaign_id: string; status: string }[]) {
      const p = (progress[t.campaign_id] ||= { total: 0, done: 0 })
      p.total += 1
      if (t.status === "done") p.done += 1
    }
  }
  const result = (campaigns || []).map((c: { id: string }) => ({ ...c, progress: progress[c.id] || { total: 0, done: 0 } }))
  return NextResponse.json({ campaigns: result })
}

/**
 * POST — create a campaign and fan out advocacy tasks.
 * Body: { workspace_id, social_post_id, window_end?, instructions?, action_types?, assignees? }
 * Assignees resolve to: body.assignees → opted-in advocates → all workspace members.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, social_post_id } = body
    if (!workspace_id || !social_post_id) {
      return NextResponse.json({ error: "workspace_id and social_post_id required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()

    const actions: AdvocacyAction[] =
      Array.isArray(body.action_types) && body.action_types.length ? body.action_types : DEFAULT_ACTIONS

    // Resolve assignees.
    let assignees: string[] = Array.isArray(body.assignees) ? body.assignees : []
    if (!assignees.length) {
      const { data: optins } = await supabase
        .from("advocacy_optin")
        .select("user_id")
        .eq("workspace_id", workspace_id)
      assignees = (optins || []).map((o: { user_id: string }) => o.user_id)
    }
    if (!assignees.length) {
      const { data: membersList } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspace_id)
      assignees = (membersList || []).map((m: { user_id: string }) => m.user_id)
    }
    if (!assignees.length) {
      return NextResponse.json({ error: "no members to assign" }, { status: 400 })
    }

    const { data: campaign, error: campErr } = await supabase
      .from("amplification_campaigns")
      .insert({
        workspace_id,
        social_post_id,
        window_end: body.window_end || null,
        instructions: body.instructions || null,
        status: "active",
        created_by: auth.userId,
      })
      .select("*")
      .single()
    if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 })

    const rows: Record<string, unknown>[] = []
    for (const userId of assignees) {
      for (const action of actions) {
        rows.push({
          workspace_id,
          campaign_id: campaign.id,
          assignee_user_id: userId,
          action_type: action,
          status: "pending",
          points: ACTION_POINTS[action] ?? 1,
        })
      }
    }
    const { error: tasksErr } = await supabase.from("advocacy_tasks").insert(rows)
    if (tasksErr) return NextResponse.json({ error: tasksErr.message }, { status: 500 })

    return NextResponse.json({ campaign, tasks_created: rows.length }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/** PATCH — update campaign status. Body: { workspace_id, id, status } */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id, status } = body
    if (!workspace_id || !id || !status) {
      return NextResponse.json({ error: "workspace_id, id, status required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("amplification_campaigns")
      .update({ status })
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
