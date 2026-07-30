"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Loader2, BarChart3 } from "lucide-react"

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

function defaultRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const to = now.toISOString().slice(0, 10)
  return { from, to }
}

export function ReportsPanel({ workspaceId }: { workspaceId: string }) {
  const init = defaultRange()
  const [from, setFrom] = useState(init.from)
  const [to, setTo] = useState(init.to)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance/reports?workspace_id=${workspaceId}&from=${from}&to=${to}`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(j.error || "Could not build report")
        return
      }
      setRows(j.rows || [])
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    window.open(`/api/attendance/reports?workspace_id=${workspaceId}&from=${from}&to=${to}&format=csv`, "_blank")
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Attendance Report</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-auto" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-auto" />
          <Button size="sm" onClick={run} disabled={loading} className="gap-1 bg-[#0A1628] hover:bg-[#0A1628]/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />} Run
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1"><Download className="h-4 w-4" /> CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Run a report to see the summary.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-3 font-medium">Present</th>
                  <th className="py-2 pr-3 font-medium">Late</th>
                  <th className="py-2 pr-3 font-medium">Half</th>
                  <th className="py-2 pr-3 font-medium">Leave</th>
                  <th className="py-2 pr-3 font-medium">Absent</th>
                  <th className="py-2 pr-3 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-3">{r.present}</td>
                    <td className="py-2 pr-3">{r.late}</td>
                    <td className="py-2 pr-3">{r.half_day}</td>
                    <td className="py-2 pr-3">{r.on_leave}</td>
                    <td className="py-2 pr-3">{r.absent}</td>
                    <td className="py-2 pr-3">{r.worked_hours}</td>
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
