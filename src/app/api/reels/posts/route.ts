import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"
import { getCredential } from "@/lib/social-monitor/credentials"
import { publishReel, InstagramApiError } from "@/lib/reels/instagram"

/** GET — list posts (optionally with the latest metric snapshot). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data: posts, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach the latest metric snapshot per post.
  const ids = (posts || []).map((p: { id: string }) => p.id)
  const latest: Record<string, unknown> = {}
  if (ids.length) {
    const { data: metrics } = await supabase
      .from("social_post_metrics")
      .select("*")
      .in("social_post_id", ids)
      .order("captured_at", { ascending: false })
    for (const m of (metrics || []) as { social_post_id: string }[]) {
      if (!latest[m.social_post_id]) latest[m.social_post_id] = m
    }
  }
  const withMetrics = (posts || []).map((p: { id: string }) => ({ ...p, latest_metric: latest[p.id] || null }))
  return NextResponse.json({ posts: withMetrics })
}

/**
 * POST — register an existing Reel, or publish a new one.
 * Body (register): { workspace_id, platform, external_id?, permalink?, caption?, item_id?, social_account_id?, published_at? }
 * Body (publish):  { workspace_id, mode: "publish", social_account_id, video_url, caption? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id } = body
    if (!workspace_id) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()

    if (body.mode === "publish") {
      if (!body.social_account_id || !body.video_url) {
        return NextResponse.json({ error: "social_account_id and video_url required" }, { status: 400 })
      }
      const { data: account } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("id", body.social_account_id)
        .eq("workspace_id", workspace_id)
        .maybeSingle()
      if (!account) return NextResponse.json({ error: "account not found" }, { status: 404 })
      const igUserId = (account as { external_account_id: string | null }).external_account_id
      if (!igUserId) {
        return NextResponse.json({ error: "account missing external_account_id" }, { status: 400 })
      }

      const cred = await getCredential(workspace_id, "meta")
      if (!cred) {
        return NextResponse.json(
          { error: "Meta credential not configured", code: "not_configured", provider: "meta" },
          { status: 501 }
        )
      }

      let result
      try {
        result = await publishReel({
          igUserId,
          accessToken: cred.secret,
          videoUrl: body.video_url,
          caption: body.caption,
        })
      } catch (e) {
        const status = e instanceof InstagramApiError ? e.status : 502
        return NextResponse.json({ error: e instanceof Error ? e.message : "Publish failed" }, { status })
      }

      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          workspace_id,
          platform: (account as { platform: string }).platform,
          social_account_id: body.social_account_id,
          external_id: result.external_id,
          permalink: result.permalink,
          caption: body.caption || null,
          media_type: "reel",
          item_id: body.item_id || null,
          is_source: true,
          published_at: new Date().toISOString(),
        })
        .select("*")
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ post: data, published: true }, { status: 201 })
    }

    // register mode (default)
    if (!body.platform) return NextResponse.json({ error: "platform required" }, { status: 400 })
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        workspace_id,
        platform: body.platform,
        social_account_id: body.social_account_id || null,
        external_id: body.external_id || null,
        permalink: body.permalink || null,
        caption: body.caption || null,
        media_type: body.media_type || "reel",
        item_id: body.item_id || null,
        brief_id: body.brief_id || null,
        is_source: body.is_source ?? true,
        published_at: body.published_at || new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/** PATCH — update a post (permalink, caption, item link). */
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
    for (const f of ["permalink", "caption", "item_id", "external_id", "published_at"]) {
      if (f in updates) allowed[f] = updates[f]
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("social_posts")
      .update(allowed)
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ post: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
