import { AttendanceStatus } from "@/lib/attendance/types"

/** Format minutes as e.g. "7h 45m". */
export function formatDuration(mins: number | null | undefined): string {
  if (!mins || mins <= 0) return "—"
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

/** Format an ISO timestamp as local time "09:12 AM". */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}

/** Tailwind classes for a status badge. */
export function statusClasses(status: AttendanceStatus): string {
  switch (status) {
    case "present": return "bg-emerald-100 text-emerald-700"
    case "late": return "bg-amber-100 text-amber-700"
    case "half_day": return "bg-orange-100 text-orange-700"
    case "on_leave": return "bg-blue-100 text-blue-700"
    case "holiday": return "bg-purple-100 text-purple-700"
    case "weekend": return "bg-slate-100 text-slate-500"
    case "absent": return "bg-red-100 text-red-700"
    default: return "bg-slate-100 text-slate-600"
  }
}
