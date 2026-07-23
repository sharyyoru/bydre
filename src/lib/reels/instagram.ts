import { ReelMetricSnapshot } from "./types"

/**
 * Thin Instagram Graph API (Facebook Login) adapter for Reels publishing +
 * insights. All calls require a valid long-lived access token with
 * instagram_content_publish / instagram_manage_insights (Advanced Access).
 *
 * NOTE: The API cannot force engagement or post to another user's Story — the
 * advocacy engine orchestrates human actions instead.
 */
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0"
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

export class InstagramApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "InstagramApiError"
    this.status = status
  }
}

async function graphGet(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new InstagramApiError(json?.error?.message || `Graph GET ${path} failed`, res.status)
  }
  return json
}

async function graphPost(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH}/${path}`)
  const body = new URLSearchParams(params)
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new InstagramApiError(json?.error?.message || `Graph POST ${path} failed`, res.status)
  }
  return json
}

export interface PublishReelParams {
  igUserId: string
  accessToken: string
  videoUrl: string // must be a public URL
  caption?: string
  shareToFeed?: boolean
}

/**
 * Publish a Reel: create a REELS container, poll until FINISHED, then publish.
 * Returns the published media id + permalink.
 */
export async function publishReel(
  params: PublishReelParams,
  opts: { maxWaitMs?: number; pollIntervalMs?: number } = {}
): Promise<{ external_id: string; permalink: string | null }> {
  const { igUserId, accessToken, videoUrl, caption, shareToFeed = true } = params
  const maxWaitMs = opts.maxWaitMs ?? 120_000
  const pollIntervalMs = opts.pollIntervalMs ?? 5_000

  const container = await graphPost(`${igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    share_to_feed: String(shareToFeed),
    ...(caption ? { caption } : {}),
    access_token: accessToken,
  })
  const creationId = container.id as string

  const deadline = Date.now() + maxWaitMs
  // Poll container readiness before publishing.
  // status_code: IN_PROGRESS | FINISHED | ERROR | EXPIRED | PUBLISHED
  while (Date.now() < deadline) {
    const status = await graphGet(creationId, {
      fields: "status_code,status",
      access_token: accessToken,
    })
    if (status.status_code === "FINISHED") break
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new InstagramApiError(`Reel container ${status.status_code}: ${status.status || ""}`, 502)
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs))
  }

  const published = await graphPost(`${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  })
  const externalId = published.id as string

  let permalink: string | null = null
  try {
    const media = await graphGet(externalId, { fields: "permalink", access_token: accessToken })
    permalink = media.permalink || null
  } catch {
    // permalink is best-effort
  }
  return { external_id: externalId, permalink }
}

/** Check remaining publishing quota (default 50 per 24h). */
export async function getPublishingQuota(
  igUserId: string,
  accessToken: string
): Promise<{ used: number; total: number }> {
  const res = await graphGet(`${igUserId}/content_publishing_limit`, {
    fields: "quota_usage,config",
    access_token: accessToken,
  })
  const row = res?.data?.[0] || {}
  return { used: Number(row.quota_usage || 0), total: Number(row?.config?.quota_total || 50) }
}

const REEL_INSIGHT_METRICS = [
  "reach",
  "likes",
  "comments",
  "saved",
  "shares",
  "views",
  "ig_reels_avg_watch_time",
  "reels_skip_rate",
].join(",")

/** Fetch per-Reel insights. Data can lag up to 48h. */
export async function fetchReelInsights(
  mediaId: string,
  accessToken: string
): Promise<ReelMetricSnapshot> {
  const res = await graphGet(`${mediaId}/insights`, {
    metric: REEL_INSIGHT_METRICS,
    access_token: accessToken,
  })
  const map: Record<string, number> = {}
  for (const entry of res?.data || []) {
    const value = entry?.values?.[0]?.value ?? entry?.total_value?.value
    if (typeof value === "number") map[entry.name] = value
  }
  // reposts_count / shares_count also available on the media object as fields.
  let reposts: number | null = null
  try {
    const media = await graphGet(mediaId, { fields: "reposts_count", access_token: accessToken })
    if (typeof media.reposts_count === "number") reposts = media.reposts_count
  } catch {
    /* optional */
  }

  return {
    views: map.views ?? null,
    reach: map.reach ?? null,
    likes: map.likes ?? null,
    comments: map.comments ?? null,
    saves: map.saved ?? null,
    shares: map.shares ?? null,
    reposts,
    avg_watch_time: map.ig_reels_avg_watch_time ?? null,
    skip_rate: map.reels_skip_rate ?? null,
  }
}
