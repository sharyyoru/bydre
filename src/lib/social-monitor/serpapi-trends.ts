import { getCredential } from "./credentials"
import { NotConfiguredError } from "./types"

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
 * Fetch Google Trends interest + velocity for keywords via SerpApi.
 * Docs: https://serpapi.com/google-trends-api
 */
export async function fetchTrends(
  params: FetchTrendsParams
): Promise<SentimentMetricInput[]> {
  const cred = await getCredential(params.workspaceId, "serpapi")
  if (!cred) throw new NotConfiguredError("serpapi")

  const geo = params.geo || "AE"
  const results: SentimentMetricInput[] = []

  for (const keyword of params.keywords) {
    const url = new URL("https://serpapi.com/search.json")
    url.searchParams.set("engine", "google_trends")
    url.searchParams.set("q", keyword)
    url.searchParams.set("geo", geo)
    url.searchParams.set("data_type", "TIMESERIES")
    url.searchParams.set("api_key", cred.secret)

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`SerpApi Trends failed for "${keyword}": ${res.status}`)
    }
    const json = (await res.json()) as any
    const timeline: any[] = json?.interest_over_time?.timeline_data ?? []

    const values = timeline
      .map((point) => Number(point?.values?.[0]?.extracted_value ?? 0))
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
      source: "serpapi",
      raw: json?.interest_over_time ?? {},
    })
  }

  return results
}
