"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { AttendanceRecord, ATTENDANCE_STATUS_LABELS } from "@/lib/attendance/types"
import { formatDate, formatDuration, formatTime, statusClasses } from "./format"

function monthRange(d: Date): { from: string; to: string; label: string } {
  const y = d.getFullYear()
  const m = d.getMonth()
  const from = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
  const to = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10)
  const label = d.toLocaleDateString([], { month: "long", year: "numeric" })
  return { from, to, label }
}

export function Timesheet({ workspaceId, refreshKey }: { workspaceId: string; refreshKey?: number }) {
  const [cursor, setCursor] = useState(new Date())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)

  const { from, to, label } = monthRange(cursor)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance/records?workspace_id=${workspaceId}&from=${from}&to=${to}`)
      if (res.ok) setRecords((await res.json()).records || [])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, from, to])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const shiftMonth = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  const totalMinutes = records.reduce((sum, r) => sum + (r.worked_minutes || 0), 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">My Timesheet</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total: {formatDuration(totalMinutes)}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[130px] text-center text-sm font-medium">{label}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No attendance records this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">In</th>
                  <th className="py-2 pr-4 font-medium">Out</th>
                  <th className="py-2 pr-4 font-medium">Worked</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{formatDate(r.work_date)}</td>
                    <td className="py-2 pr-4">{formatTime(r.check_in_at)}</td>
                    <td className="py-2 pr-4">{formatTime(r.check_out_at)}</td>
                    <td className="py-2 pr-4">{formatDuration(r.worked_minutes)}</td>
                    <td className="py-2 pr-4">
                      <Badge className={`${statusClasses(r.status)} border-0`}>{ATTENDANCE_STATUS_LABELS[r.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
