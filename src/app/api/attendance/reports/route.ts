import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getHolidaySet, getOrCreateSettings, requireWorkspaceAdmin } from "../_helpers"
import { enumerateDates, isHoliday, isWeekend, isWorkingDay } from "@/lib/attendance/logic"
import { AttendanceRecord } from "@/lib/attendance/types"

interface ReportRow {
  user_id: string
  name: string
  email: string
  present: number
  late: number
  half_day: number
  on_leave: number
  absent: number
  holiday: number
  weekend: number
  worked_hours: number
}

/**
 * GET — admin attendance report across a date range.
 * Query: workspace_id, from, to, format=json|csv
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const workspaceId = sp.get("workspace_id")
  const from = sp.get("from")
  const to = sp.get("to")
  if (!workspaceId || !from || !to) {
    return NextResponse.json({ error: "workspace_id, from, to required" }, { status: 400 })
  }

  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const settings = await getOrCreateSettings(workspaceId)
  const holidays = await getHolidaySet(workspaceId)
  const dates = enumerateDates(from, to)

  const supabase = await createClient()
  const [{ data: members }, { data: records }, { data: leaves }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("user_id, profiles(id, full_name, email)")
      .eq("workspace_id", workspaceId),
    supabase
      .from("attendance_records")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gte("work_date", from)
      .lte("work_date", to),
    supabase
      .from("leave_requests")
      .select("user_id, start_date, end_date")
      .eq("workspace_id", workspaceId)
      .eq("status", "approved")
      .lte("start_date", to)
      .gte("end_date", from),
  ])

  // Index records by user+date.
  const recByUserDate = new Map<string, AttendanceRecord>()
  for (const r of (records || []) as AttendanceRecord[]) recByUserDate.set(`${r.user_id}|${r.work_date}`, r)

  // Index approved-leave working days by user.
  const leaveByUser = new Map<string, Set<string>>()
  for (const l of (leaves || []) as { user_id: string; start_date: string; end_date: string }[]) {
    const set = leaveByUser.get(l.user_id) || new Set<string>()
    for (const d of enumerateDates(l.start_date, l.end_date)) {
      if (d >= from && d <= to && isWorkingDay(d, settings, holidays)) set.add(d)
    }
    leaveByUser.set(l.user_id, set)
  }

  const rows: ReportRow[] = []
  for (const m of (members || []) as { user_id: string; profiles: { full_name?: string; email?: string } | null }[]) {
    const row: ReportRow = {
      user_id: m.user_id,
      name: m.profiles?.full_name || m.profiles?.email || "Unknown",
      email: m.profiles?.email || "",
      present: 0, late: 0, half_day: 0, on_leave: 0, absent: 0, holiday: 0, weekend: 0, worked_hours: 0,
    }
    const userLeave = leaveByUser.get(m.user_id) || new Set<string>()

    for (const d of dates) {
      const rec = recByUserDate.get(`${m.user_id}|${d}`)
      if (rec) {
        if (rec.worked_minutes) row.worked_hours += rec.worked_minutes / 60
        switch (rec.status) {
          case "present": row.present++; break
          case "late": row.late++; break
          case "half_day": row.half_day++; break
          case "on_leave": row.on_leave++; break
          case "holiday": row.holiday++; break
          case "weekend": row.weekend++; break
        }
        continue
      }
      if (isWeekend(d, settings)) row.weekend++
      else if (isHoliday(d, holidays)) row.holiday++
      else if (userLeave.has(d)) row.on_leave++
      else row.absent++
    }
    row.worked_hours = Math.round(row.worked_hours * 100) / 100
    rows.push(row)
  }

  rows.sort((a, b) => a.name.localeCompare(b.name))

  if (sp.get("format") === "csv") {
    const header = ["Name", "Email", "Present", "Late", "Half day", "On leave", "Absent", "Holidays", "Weekends", "Worked hours"]
    const lines = [header.join(",")]
    for (const r of rows) {
      lines.push(
        [r.name, r.email, r.present, r.late, r.half_day, r.on_leave, r.absent, r.holiday, r.weekend, r.worked_hours]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance_${from}_to_${to}.csv"`,
      },
    })
  }

  return NextResponse.json({ rows, from, to })
}
