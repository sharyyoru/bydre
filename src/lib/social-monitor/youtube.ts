import { getCredential } from "./credentials"
import { NotConfiguredError } from "./types"
import { SentimentMetricInput } from "./serpapi-trends"

export interface FetchYouTubeParams {
  workspaceId: string
  keywords: string[]
  geo?: string
  periodStart: string
  periodEnd: string
  maxResults?: number
}

/**
 * Fetch YouTube engagement signals per keyword via YouTube Data API v3.
 * Uses search.list to find recent videos, then videos.list for statistics.
 */
export async function fetchYouTube(
  params: FetchYouTubeParams
): Promise<SentimentMetricInput[]> {
  const cred = await getCredential(params.workspaceId, "youtube")
  if (!cred) throw new NotConfiguredError("youtube")

  const geo = params.geo || "AE"
  const maxResults = params.maxResults ?? 15
  const results: SentimentMetricInput[] = []

  for (const keyword of params.keywords) {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
    searchUrl.searchParams.set("part", "id")
    searchUrl.searchParams.set("q", keyword)
    searchUrl.searchParams.set("type", "video")
    searchUrl.searchParams.set("regionCode", geo)
    searchUrl.searchParams.set("maxResults", String(maxResults))
    searchUrl.searchParams.set("order", "relevance")
    searchUrl.searchParams.set("key", cred.secret)

    const searchRes = await fetch(searchUrl.toString(), { cache: "no-store" })
    if (!searchRes.ok) {
      throw new Error(`YouTube search failed for "${keyword}": ${searchRes.status}`)
    }
    const searchJson = (await searchRes.json()) as any
    const videoIds: string[] = (searchJson?.items ?? [])
      .map((it: any) => it?.id?.videoId)
      .filter(Boolean)

    let totalViews = 0
    let totalLikes = 0
    let totalComments = 0

    if (videoIds.length) {
      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
      statsUrl.searchParams.set("part", "statistics")
      statsUrl.searchParams.set("id", videoIds.join(","))
      statsUrl.searchParams.set("key", cred.secret)

      const statsRes = await fetch(statsUrl.toString(), { cache: "no-store" })
      if (!statsRes.ok) {
        throw new Error(`YouTube stats failed for "${keyword}": ${statsRes.status}`)
      }
      const statsJson = (await statsRes.json()) as any
      for (const v of statsJson?.items ?? []) {
        totalViews += Number(v?.statistics?.viewCount ?? 0)
        totalLikes += Number(v?.statistics?.likeCount ?? 0)
        totalComments += Number(v?.statistics?.commentCount ?? 0)
      }
    }

    // Composite engagement score: views + weighted interactions.
    const engagement = totalViews + totalLikes * 10 + totalComments * 20

    results.push({
      workspace_id: params.workspaceId,
      keyword,
      platform: "youtube",
      search_volume: null,
      velocity: null,
      engagement_score: engagement,
      video_count: videoIds.length,
      geo,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      source: "youtube",
      raw: { totalViews, totalLikes, totalComments, videoIds },
    })
  }

  return results
}
