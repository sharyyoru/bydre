// Sales Intelligence Brain - Type Definitions

export interface DeveloperProfile {
  id: string
  workspace_id: string
  external_id: number | null
  name: string
  logo_url: string | null
  website_url: string | null
  headquarters: string | null
  founded_year: number | null
  total_projects: number
  completed_projects: number
  avg_delivery_delay_months: number | null
  reliability_score: number | null
  payment_flexibility: "high" | "medium" | "low" | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProjectCommission {
  id: string
  workspace_id: string
  project_id: string | null
  project_name: string
  developer_name: string | null
  base_commission_percent: number
  early_bird_bonus_percent: number | null
  early_bird_deadline: string | null
  volume_bonus_percent: number | null
  volume_threshold: number | null
  payment_terms: string | null
  special_incentives: string | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InventorySnapshot {
  id: string
  workspace_id: string
  project_id: string | null
  project_name: string
  snapshot_date: string
  total_units: number | null
  available_units: number | null
  sold_units: number | null
  reserved_units: number
  avg_price_aed: number | null
  min_price_aed: number | null
  max_price_aed: number | null
  source: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface SalesOpportunity {
  id: string
  workspace_id: string
  project_id: string | null
  project_name: string
  developer_name: string | null
  
  // Scores (0-100)
  overall_score: number
  velocity_score: number | null
  commission_score: number | null
  demand_score: number | null
  urgency_score: number | null
  
  // Key metrics
  daily_sales_rate: number | null
  inventory_remaining_pct: number | null
  days_to_sellout: number | null
  effective_commission_pct: number | null
  
  // AI reasoning
  reasoning: string | null
  key_selling_points: string[]
  target_buyer_profile: string | null
  
  computed_at: string
  valid_until: string
  rank: number | null
  created_at: string
}

export interface MarketSignal {
  id: string
  workspace_id: string
  signal_type: "launch" | "price_change" | "news" | "social" | "trend"
  source: string
  
  project_id: string | null
  project_name: string | null
  developer_id: string | null
  developer_name: string | null
  area_name: string | null
  
  title: string | null
  description: string | null
  url: string | null
  sentiment: "positive" | "negative" | "neutral" | null
  sentiment_score: number | null
  reach_estimate: number | null
  engagement_count: number | null
  
  trend_value: number | null
  trend_change_pct: number | null
  
  raw_data: Record<string, unknown> | null
  signal_date: string
  created_at: string
}

export interface ProjectAlert {
  id: string
  workspace_id: string
  alert_type: "low_inventory" | "new_launch" | "price_change" | "velocity_spike"
  severity: "critical" | "warning" | "info"
  
  project_id: string | null
  project_name: string | null
  developer_name: string | null
  
  title: string
  message: string
  data: Record<string, unknown> | null
  
  is_read: boolean
  read_at: string | null
  read_by: string | null
  
  triggered_at: string
  expires_at: string
  created_at: string
}

export interface DailyBriefing {
  id: string
  workspace_id: string
  briefing_date: string
  
  top_opportunities: SalesOpportunitySummary[] | null
  alerts_summary: AlertSummary[] | null
  market_signals_summary: SignalSummary[] | null
  trending_topics: TrendingTopic[] | null
  
  executive_summary: string | null
  full_content: string | null
  
  email_sent_at: string | null
  email_recipients: string[] | null
  
  generated_at: string
  created_at: string
}

// Summary types for briefings
export interface SalesOpportunitySummary {
  project_name: string
  developer_name: string | null
  overall_score: number
  commission_pct: number
  inventory_pct: number
  reasoning_snippet: string
}

export interface AlertSummary {
  alert_type: string
  title: string
  project_name: string | null
  severity: string
}

export interface SignalSummary {
  signal_type: string
  title: string
  source: string
  sentiment: string | null
}

export interface TrendingTopic {
  topic: string
  change_pct: number
  signal_count: number
}

// Velocity calculation result
export interface VelocityMetrics {
  project_id: string
  project_name: string
  daily_sales_rate: number
  weekly_sales_rate: number
  inventory_remaining_pct: number
  days_to_sellout: number | null
  velocity_score: number // 0-100
  trend: "accelerating" | "stable" | "decelerating"
  snapshots: {
    date: string
    available_units: number
    sold_since_last: number
  }[]
}

// AI recommendation request/response
export interface RecommendationRequest {
  workspace_id: string
  limit?: number
  area_filter?: string
  developer_filter?: string
  min_commission?: number
  include_reasoning?: boolean
}

export interface RecommendationResponse {
  opportunities: SalesOpportunity[]
  market_summary: string | null
  generated_at: string
}

// Commission input form
export interface CommissionInput {
  project_name: string
  project_id?: string
  developer_name?: string
  base_commission_percent: number
  early_bird_bonus_percent?: number
  early_bird_deadline?: string
  volume_bonus_percent?: number
  volume_threshold?: number
  payment_terms?: string
  special_incentives?: string
  valid_from?: string
  valid_until?: string
  notes?: string
}

// Scraper types
export interface ScraperResult {
  developer: string
  projects: ScrapedProject[]
  scraped_at: string
  errors: string[]
}

export interface ScrapedProject {
  name: string
  external_id?: string
  url?: string
  total_units?: number
  available_units?: number
  sold_units?: number
  price_min?: number
  price_max?: number
  handover_date?: string
  status?: string
  raw_data?: Record<string, unknown>
}
