import { NextRequest } from "next/server"
import { createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { FeedItem } from "@/lib/social-monitor/feed"
import { ContentBrief, DistributionEntry } from "@/lib/social-monitor/types"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function extractToken(request: NextRequest): string | null {
  const q = request.nextUrl.searchParams.get("token")
  if (q) return q
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}

export interface FeedData {
  workspaceName: string
  items: FeedItem[]
}

/**
 * Validate the feed token and return feed data, or null if unauthorized.
 * Uses the service role (external headless workers have no user session).
 */
export async function resolveFeed(request: NextRequest): Promise<FeedData | null> {
  const token = extractToken(request)
  if (!token) return null

  const admin = createAdminClient()
  const { data: tokenRow } = await admin
    .from("social_feed_tokens")
    .select("workspace_id, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle()

  if (!tokenRow || (tokenRow as { revoked_at: string | null }).revoked_at) return null
  const workspaceId = (tokenRow as { workspace_id: string }).workspace_id

  const [{ data: workspace }, { data: briefs }, { data: dist }] = await Promise.all([
    admin.from("workspaces").select("name").eq("id", workspaceId).maybeSingle(),
    admin
      .from("content_briefs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("status", ["approved", "scheduled", "published"])
      .order("updated_at", { ascending: false }),
    admin.from("distribution_queue").select("*").eq("workspace_id", workspaceId),
  ])

  const distByBrief = new Map<string, DistributionEntry[]>()
  for (const d of (dist || []) as DistributionEntry[]) {
    const list = distByBrief.get(d.brief_id) || []
    list.push(d)
    distByBrief.set(d.brief_id, list)
  }

  const items: FeedItem[] = ((briefs || []) as ContentBrief[]).map((b) => ({
    ...b,
    distributions: distByBrief.get(b.id) || [],
  }))

  return {
    workspaceName: (workspace as { name: string } | null)?.name || "bydre",
    items,
  }
}
