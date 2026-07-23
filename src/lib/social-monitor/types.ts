export type IntegrationProvider =
  | "gemini"
  | "dubai_pulse"
  | "serpapi"
  | "youtube"
  | "meta"
  | "tiktok"

export type RegistrationType = "off_plan" | "ready"
export type SentimentPlatform = "google_trends" | "youtube"

export type BriefStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"

export type DistributionStatus =
  | "queued"
  | "processing"
  | "published"
  | "failed"
  | "cancelled"

export interface MarketMetric {
  id: string
  workspace_id: string
  area_name: string
  property_type: string | null
  registration_type: RegistrationType
  transaction_count: number
  total_value_aed: number
  avg_value_aed: number
  median_value_aed: number | null
  roi_percent: number | null
  period_start: string
  period_end: string
  source: string
  raw: Record<string, unknown>
  ingested_at: string
  created_at: string
}

export interface SentimentMetric {
  id: string
  workspace_id: string
  keyword: string
  platform: SentimentPlatform
  search_volume: number | null
  velocity: number | null
  engagement_score: number | null
  video_count: number | null
  geo: string
  period_start: string
  period_end: string
  source: string
  raw: Record<string, unknown>
  ingested_at: string
  created_at: string
}

export interface PlatformCopy {
  instagram?: string
  tiktok?: string
  youtube?: string
  x?: string
  linkedin?: string
}

export interface ContentBrief {
  id: string
  workspace_id: string
  title: string
  angle: string | null
  hook: string | null
  summary: string | null
  platform_copy: PlatformCopy
  target_area: string | null
  keywords: string[]
  arbitrage_score: number | null
  status: BriefStatus
  source_market_metric_id: string | null
  source_sentiment_metric_id: string | null
  generated_by: string
  model: string | null
  raw: Record<string, unknown>
  created_by: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface DistributionEntry {
  id: string
  workspace_id: string
  brief_id: string
  platform: string
  scheduled_at: string | null
  status: DistributionStatus
  external_id: string | null
  external_url: string | null
  error: string | null
  payload: Record<string, unknown>
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArbitrageOpportunity {
  area_name: string
  registration_type: RegistrationType
  market_strength: number
  sentiment_level: number
  arbitrage_score: number
  total_value_aed: number
  transaction_count: number
  roi_percent: number | null
  matched_keyword: string | null
  market_metric_id: string
  sentiment_metric_id: string | null
}

export interface GeneratedBrief {
  title: string
  angle: string
  hook: string
  summary: string
  platform_copy: PlatformCopy
  keywords: string[]
}

/** Thrown by adapters when the relevant API key/credential is not configured. */
export class NotConfiguredError extends Error {
  provider: IntegrationProvider
  constructor(provider: IntegrationProvider) {
    super(`${provider} not configured`)
    this.name = "NotConfiguredError"
    this.provider = provider
  }
}
