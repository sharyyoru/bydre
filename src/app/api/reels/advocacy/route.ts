import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember } from "../_helpers"

/**
 * GET — current user's advocacy tasks + workspace leaderboard.
 * Query: workspace_id
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()

  const { data: myTasks, error } = await supabase
    .from("advocacy_tasks")
    .select("*, amplification_campaigns(id, instructions, window_end, social_posts(caption, permalink, platform))")
    .eq("workspace_id", workspaceId)
    .eq("assignee_user_id", auth.userId)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Leaderboard: sum points of completed tasks per user.
  const { data: doneTasks } = await supabase
    .from("advocacy_tasks")
    .select("assignee_user_id, points")
    .eq("workspace_id", workspaceId)
    .eq("status", "done")

  const totals: Record<string, number> = {}
  for (const t of (doneTasks || []) as { assignee_user_id: string; points: number }[]) {
    totals[t.assignee_user_id] = (totals[t.assignee_user_id] || 0) + (t.points || 0)
  }
  const userIds = Object.keys(totals)
  let leaderboard: { user_id: string; name: string; points: number }[] = []
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
    const nameOf = (id: string) => {
      const p = (profiles || []).find((x: { id: string }) => x.id === id) as
        | { full_name: string | null; email: string }
        | undefined
      return p?.full_name || p?.email || "Unknown"
    }
    leaderboard = userIds
      .map((id) => ({ user_id: id, name: nameOf(id), points: totals[id] }))
      .sort((a, b) => b.points - a.points)
  }

  return NextResponse.json({ tasks: myTasks, leaderboard })
}

/**
 * PATCH — complete/skip one of the current user's own tasks.
 * Body: { workspace_id, id, status: "done"|"skipped"|"pending", proof_url? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id, status } = body
    if (!workspace_id || !id || !status) {
      return NextResponse.json({ error: "workspace_id, id, status required" }, { status: 400 })
    }
    const auth = await requireWorkspaceMember(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    // RLS ensures the user can only update their own task rows.
    const { data, error } = await supabase
      .from("advocacy_tasks")
      .update({
        status,
        proof_url: body.proof_url ?? null,
        completed_at: status === "done" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .eq("assignee_user_id", auth.userId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ task: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
