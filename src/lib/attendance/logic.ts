import { AttendanceSettings, AttendanceStatus, DayPortion } from "./types"

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/** Local calendar date 'YYYY-MM-DD' for an instant in a given IANA timezone. */
export function localDateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

/** Minutes since local midnight for an instant in a timezone. */
export function localMinutesInTz(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0")
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0")
  return (hour % 24) * 60 + minute
}

/** Weekday index (0=Sun..6=Sat) for an instant in a timezone. */
export function weekdayInTz(date: Date, tz: string): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(date)
  return WEEKDAY_INDEX[short] ?? new Date(date).getUTCDay()
}

/** Weekday index (0=Sun..6=Sat) for a plain 'YYYY-MM-DD' date string. */
export function weekdayOfDateStr(dateStr: string): number {
  // Treat as UTC noon to avoid TZ edge shifts.
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay()
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":")
  return Number(h) * 60 + Number(m || 0)
}

export function minutesBetween(startISO: string, endISO: string): number {
  return Math.max(0, Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000))
}

export function isWeekend(dateStr: string, settings: AttendanceSettings): boolean {
  return settings.weekend_days.includes(weekdayOfDateStr(dateStr))
}

export function isHoliday(dateStr: string, holidayDates: Set<string>): boolean {
  return holidayDates.has(dateStr)
}

export function isWorkingDay(dateStr: string, settings: AttendanceSettings, holidayDates: Set<string>): boolean {
  return !isWeekend(dateStr, settings) && !isHoliday(dateStr, holidayDates)
}

/** Derive the stored status from timings. Called at check-in and check-out. */
export function deriveStatus(params: {
  checkInAt: string | null
  workedMinutes: number | null
  settings: AttendanceSettings
}): AttendanceStatus {
  const { checkInAt, workedMinutes, settings } = params
  if (workedMinutes != null && workedMinutes < settings.half_day_minutes) return "half_day"
  if (checkInAt) {
    const lateThreshold = parseTimeToMinutes(settings.work_start) + settings.grace_minutes
    if (localMinutesInTz(new Date(checkInAt), settings.timezone) > lateThreshold) return "late"
  }
  return "present"
}

/** Count chargeable leave days across a range, excluding weekends/holidays. */
export function countLeaveDays(
  startDate: string,
  endDate: string,
  portion: DayPortion,
  settings: AttendanceSettings,
  holidayDates: Set<string>
): number {
  const start = new Date(`${startDate}T12:00:00Z`)
  const end = new Date(`${endDate}T12:00:00Z`)
  if (end < start) return 0

  // Half-day only applies to a single working day.
  if (startDate === endDate) {
    if (!isWorkingDay(startDate, settings, holidayDates)) return 0
    return portion === "full" ? 1 : 0.5
  }

  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const ds = cursor.toISOString().slice(0, 10)
    if (isWorkingDay(ds, settings, holidayDates)) count += 1
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return count
}

/** Enumerate 'YYYY-MM-DD' strings inclusive between two dates. */
export function enumerateDates(startDate: string, endDate: string): string[] {
  const out: string[] = []
  const start = new Date(`${startDate}T12:00:00Z`)
  const end = new Date(`${endDate}T12:00:00Z`)
  const cursor = new Date(start)
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}
