export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "youtube"
export type AccountKind = "brand" | "agent"
export type MediaType = "reel" | "video" | "story" | "post"
export type AccountStatus = "connected" | "expired" | "disconnected"
export type CampaignStatus = "active" | "completed" | "cancelled"
export type AdvocacyAction =
  | "share_story"
  | "repost"
  | "dm_share"
  | "comment"
  | "save"
  | "watch"
export type AdvocacyStatus = "pending" | "done" | "skipped"

export interface SocialAccount {
  id: string
  workspace_id: string
  platform: SocialPlatform
  kind: AccountKind
  external_account_id: string | null
  username: string | null
  page_id: string | null
  owner_user_id: string | null
  token_ref: string | null
  token_expires_at: string | null
  status: AccountStatus
  raw: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SocialPost {
  id: string
  workspace_id: string
  platform: SocialPlatform
  social_account_id: string | null
  external_id: string | null
  permalink: string | null
  caption: string | null
  media_type: MediaType
  item_id: string | null
  brief_id: string | null
  is_source: boolean
  source_post_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ReelMetricSnapshot {
  views: number | null
  reach: number | null
  likes: number | null
  comments: number | null
  saves: number | null
  shares: number | null
  reposts: number | null
  avg_watch_time: number | null
  skip_rate: number | null
}

export interface SocialPostMetric extends ReelMetricSnapshot {
  id: string
  social_post_id: string
  captured_at: string
  is_first_hour: boolean
  raw: Record<string, unknown>
}

export interface AmplificationCampaign {
  id: string
  workspace_id: string
  social_post_id: string
  window_start: string
  window_end: string | null
  instructions: string | null
  status: CampaignStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AdvocacyTask {
  id: string
  workspace_id: string
  campaign_id: string
  assignee_user_id: string
  action_type: AdvocacyAction
  status: AdvocacyStatus
  points: number
  completed_at: string | null
  proof_url: string | null
  created_at: string
  updated_at: string
}

/** Points awarded per genuine advocacy action (recognition only — never paid). */
export const ACTION_POINTS: Record<AdvocacyAction, number> = {
  share_story: 3,
  repost: 3,
  dm_share: 2,
  comment: 1,
  save: 1,
  watch: 1,
}

export const ACTION_LABELS: Record<AdvocacyAction, string> = {
  share_story: "Share to Story",
  repost: "Repost / Remix",
  dm_share: "Send via DM",
  comment: "Leave a genuine comment",
  save: "Save the Reel",
  watch: "Watch fully",
}
