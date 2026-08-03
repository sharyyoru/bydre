// @ts-expect-error - google-trends-api has no types
import googleTrends from "google-trends-api"

export interface SentimentMetricInput {
  workspace_id: string
  keyword: string
  platform: "google_trends" | "youtube"
  search_volume: number | null
  velocity: number | null
  engagement_score: number | null
  video_count: number | null
  geo: string
  period_start: string
  period_end: string
  source: string
  raw: Record<string, unknown>
}

export interface FetchTrendsParams {
  workspaceId: string
  keywords: string[]
  geo?: string
  periodStart: string
  periodEnd: string
}

/**
 * Fetch Google Trends interest + velocity for keywords using free google-trends-api.
 * No API key required!
 */
export async function fetchTrends(
  params: FetchTrendsParams
): Promise<SentimentMetricInput[]> {
  const geo = params.geo || "AE"
  const results: SentimentMetricInput[] = []

  for (const keyword of params.keywords) {
    try {
      const response = await googleTrends.interestOverTime({
        keyword,
        geo,
        startTime: new Date(params.periodStart),
        endTime: new Date(params.periodEnd),
      })

      const json = JSON.parse(response)
      const timeline: any[] = json?.default?.timelineData ?? []

      const values = timeline
        .map((point) => Number(point?.value?.[0] ?? 0))
        .filter((n) => Number.isFinite(n))

      const latest = values.length ? values[values.length - 1] : null
      const prev = values.length > 1 ? values[values.length - 2] : null
      const velocity =
        latest != null && prev != null ? Number((latest - prev).toFixed(2)) : null

      results.push({
        workspace_id: params.workspaceId,
        keyword,
        platform: "google_trends",
        search_volume: latest,
        velocity,
        engagement_score: null,
        video_count: null,
        geo,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        source: "google_trends_api",
        raw: json?.default ?? {},
      })
    } catch (error) {
      console.error(`Google Trends failed for "${keyword}":`, error)
      // Add empty result for failed keyword
      results.push({
        workspace_id: params.workspaceId,
        keyword,
        platform: "google_trends",
        search_volume: null,
        velocity: null,
        engagement_score: null,
        video_count: null,
        geo,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        source: "google_trends_api",
        raw: { error: String(error) },
      })
    }
  }

  return results
}
