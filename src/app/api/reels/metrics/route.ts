import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"
import { getCredential } from "@/lib/social-monitor/credentials"
import { fetchReelInsights, InstagramApiError } from "@/lib/reels/instagram"

/** GET — metrics time-series for a post. Query: workspace_id, post_id */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  const postId = request.nextUrl.searchParams.get("post_id")
  if (!workspaceId || !postId) {
    return NextResponse.json({ error: "workspace_id and post_id required" }, { status: 400 })
  }
  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("social_post_metrics")
    .select("*")
    .eq("social_post_id", postId)
    .order("captured_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ metrics: data })
}

/**
 * POST — capture a metric snapshot.
 * Body (fetch from IG): { workspace_id, post_id, mode: "fetch" }
 * Body (manual):       { workspace_id, post_id, views?, reach?, likes?, comments?, saves?, shares? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, post_id } = body
    if (!workspace_id || !post_id) {
      return NextResponse.json({ error: "workspace_id and post_id required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { data: post } = await supabase
      .from("social_posts")
      .select("id, external_id, platform, published_at")
      .eq("id", post_id)
      .eq("workspace_id", workspace_id)
      .maybeSingle()
    if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 })

    let snapshot: Record<string, number | null> = {
      views: body.views ?? null,
      reach: body.reach ?? null,
      likes: body.likes ?? null,
      comments: body.comments ?? null,
      saves: body.saves ?? null,
      shares: body.shares ?? null,
      reposts: body.reposts ?? null,
      avg_watch_time: body.avg_watch_time ?? null,
      skip_rate: body.skip_rate ?? null,
    }

    if (body.mode === "fetch") {
      const p = post as { external_id: string | null; platform: string }
      if (p.platform !== "instagram") {
        return NextResponse.json({ error: "fetch only supports instagram posts" }, { status: 400 })
      }
      if (!p.external_id) return NextResponse.json({ error: "post missing external_id" }, { status: 400 })
      const cred = await getCredential(workspace_id, "meta")
      if (!cred) {
        return NextResponse.json(
          { error: "Meta credential not configured", code: "not_configured", provider: "meta" },
          { status: 501 }
        )
      }
      try {
        snapshot = { ...snapshot, ...(await fetchReelInsights(p.external_id, cred.secret)) }
      } catch (e) {
        const status = e instanceof InstagramApiError ? e.status : 502
        return NextResponse.json({ error: e instanceof Error ? e.message : "Insights fetch failed" }, { status })
      }
    }

    // Flag first-hour snapshot (velocity signal) when within 60m of publish.
    const publishedAt = (post as { published_at: string | null }).published_at
    const isFirstHour = publishedAt
      ? Date.now() - new Date(publishedAt).getTime() <= 60 * 60 * 1000
      : false

    const { data, error } = await supabase
      .from("social_post_metrics")
      .insert({ social_post_id: post_id, is_first_hour: isFirstHour, ...snapshot })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ metric: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
