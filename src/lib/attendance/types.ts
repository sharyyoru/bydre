export type AttendanceStatus =
  | "present"
  | "late"
  | "half_day"
  | "on_leave"
  | "holiday"
  | "weekend"
  | "absent" // derived only (never stored)

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"
export type DayPortion = "full" | "first_half" | "second_half"

export interface AttendanceSettings {
  workspace_id: string
  timezone: string
  work_start: string // 'HH:MM' or 'HH:MM:SS'
  work_end: string
  grace_minutes: number
  full_day_minutes: number
  half_day_minutes: number
  weekend_days: number[] // 0=Sun .. 6=Sat
  require_selfie: boolean
  capture_geo: boolean
  created_at?: string
  updated_at?: string
}

export interface AttendanceRecord {
  id: string
  workspace_id: string
  user_id: string
  work_date: string
  check_in_at: string | null
  check_out_at: string | null
  break_minutes: number
  break_started_at: string | null
  worked_minutes: number | null
  status: AttendanceStatus
  check_in_lat: number | null
  check_in_lng: number | null
  check_out_lat: number | null
  check_out_lng: number | null
  check_in_photo_path: string | null
  check_out_photo_path: string | null
  is_regularized: boolean
  note: string | null
  created_at: string
  updated_at: string
  // Optional embed returned by the API
  user?: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null
}

export interface LeaveType {
  id: string
  workspace_id: string
  name: string
  code: string
  color: string
  annual_quota: number
  paid: boolean
  active: boolean
  position: number
  created_at?: string
}

export interface LeaveRequest {
  id: string
  workspace_id: string
  user_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  day_portion: DayPortion
  days: number
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
  // Optional embeds returned by the API
  leave_type?: { id: string; name: string; code: string; color: string; paid: boolean } | null
  user?: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null
}

export interface Holiday {
  id: string
  workspace_id: string
  name: string
  holiday_date: string
  created_at?: string
}

export interface LeaveBalance {
  leave_type_id: string
  name: string
  code: string
  color: string
  quota: number
  adjustments: number
  used: number
  remaining: number
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  half_day: "Half day",
  on_leave: "On leave",
  holiday: "Holiday",
  weekend: "Weekend",
  absent: "Absent",
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
}

export const DAY_PORTION_LABELS: Record<DayPortion, string> = {
  full: "Full day",
  first_half: "First half",
  second_half: "Second half",
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
