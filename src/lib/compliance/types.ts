// Instagram QR Compliance Monitor Types

export type AccountStatus = "connected" | "expired" | "revoked" | "error"

export type QRCodeType = "company" | "project"

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS"

export type ComplianceStatus =
  | "pending"
  | "compliant"
  | "missing_company_qr"
  | "missing_project_qr"
  | "wrong_project_qr"
  | "not_applicable"

export type NotificationChannel = "in_app" | "email"

export type NotificationType = "violation" | "reminder" | "resolved"

// Database row types
export interface AgentInstagramAccount {
  id: string
  workspace_id: string
  user_id: string
  instagram_user_id: string
  username: string | null
  display_name: string | null
  profile_picture_url: string | null
  access_token: string
  token_expires_at: string | null
  status: AccountStatus
  last_synced_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface ComplianceQRCode {
  id: string
  workspace_id: string
  type: QRCodeType
  project_id: string | null
  name: string
  image_url: string | null
  qr_data: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  project_name?: string
}

export interface InstagramPost {
  id: string
  workspace_id: string
  agent_account_id: string
  instagram_media_id: string
  media_type: MediaType
  media_url: string | null
  thumbnail_url: string | null
  permalink: string | null
  caption: string | null
  posted_at: string | null
  ingested_at: string
  // Joined fields
  agent_username?: string
  agent_display_name?: string
  agent_user_id?: string
}

export interface DetectedQRCode {
  data: string
  location?: { x: number; y: number; width: number; height: number }
  confidence?: number
  matched_qr_id?: string
  matched_qr_type?: QRCodeType
}

export interface PostComplianceCheck {
  id: string
  post_id: string
  is_real_estate_content: boolean
  real_estate_confidence: number | null
  detected_project_id: string | null
  detected_project_name: string | null
  detected_project_confidence: number | null
  company_qr_found: boolean
  project_qr_found: boolean
  project_qr_correct: boolean
  detected_qr_codes: DetectedQRCode[]
  compliance_status: ComplianceStatus
  ai_analysis_raw: Record<string, unknown> | null
  transcript: string | null
  checked_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  // Joined fields
  post?: InstagramPost
}

export interface ComplianceNotification {
  id: string
  check_id: string
  recipient_user_id: string
  channel: NotificationChannel
  notification_type: NotificationType
  message: string | null
  sent_at: string
  acknowledged_at: string | null
}

// API request/response types
export interface ConnectInstagramRequest {
  workspace_id: string
  access_token: string
}

export interface CreateQRCodeRequest {
  workspace_id: string
  type: QRCodeType
  project_id?: string
  name: string
  image_url?: string
  qr_data?: string
  description?: string
}

export interface UpdateQRCodeRequest {
  name?: string
  image_url?: string
  qr_data?: string
  description?: string
  is_active?: boolean
}

export interface SyncAccountRequest {
  workspace_id: string
  account_id: string
}

export interface CheckPostRequest {
  workspace_id: string
  post_id: string
}

// AI analysis types
export interface RealEstateClassification {
  is_real_estate: boolean
  confidence: number
  reasoning: string
}

export interface ProjectIdentification {
  project_id: string | null
  project_name: string | null
  confidence: number
  matched_keywords: string[]
}

export interface QRDetectionResult {
  qr_codes: DetectedQRCode[]
  images_analyzed: number
  frames_analyzed?: number
}

export interface AudioTranscription {
  transcript: string
  language: string
  confidence: number
  project_mentions: string[]
}

export interface PostAnalysis {
  classification: RealEstateClassification
  project: ProjectIdentification | null
  qr_detection: QRDetectionResult
  transcription: AudioTranscription | null
  processing_time_ms: number
}

export interface ComplianceResult {
  status: ComplianceStatus
  company_qr_found: boolean
  project_qr_found: boolean
  project_qr_correct: boolean
  expected_project_qr?: ComplianceQRCode
  found_project_qr?: DetectedQRCode
  violations: string[]
}

// Dashboard/report types
export interface ComplianceStats {
  total_posts: number
  compliant: number
  violations: number
  pending: number
  not_applicable: number
  compliance_rate: number
}

export interface ComplianceReport {
  workspace_id: string
  period_start: string
  period_end: string
  stats: ComplianceStats
  by_agent: {
    user_id: string
    username: string
    display_name: string
    stats: ComplianceStats
  }[]
  by_violation_type: {
    status: ComplianceStatus
    count: number
  }[]
}

// Instagram Graph API types
export interface InstagramMediaResponse {
  id: string
  media_type: MediaType
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  caption?: string
  timestamp?: string
  children?: { data: { id: string; media_type: MediaType; media_url?: string }[] }
}

export interface InstagramUserResponse {
  id: string
  username?: string
  name?: string
  profile_picture_url?: string
}
