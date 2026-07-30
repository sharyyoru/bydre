"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Camera } from "lucide-react"
import { toast } from "sonner"
import { AttendanceRecord, ATTENDANCE_STATUS_LABELS } from "@/lib/attendance/types"
import { formatDuration, formatTime, statusClasses } from "./format"

export function TeamAttendance({ workspaceId }: { workspaceId: string }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance/records?workspace_id=${workspaceId}&scope=all&from=${date}&to=${date}`)
      if (res.ok) setRecords((await res.json()).records || [])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, date])

  useEffect(() => {
    load()
  }, [load])

  const viewPhoto = async (recordId: string, which: "in" | "out") => {
    const res = await fetch(`/api/attendance/photo?workspace_id=${workspaceId}&record_id=${recordId}&which=${which}`)
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.url) window.open(j.url, "_blank")
    else toast.error(j.error || "No photo")
  }

  const present = records.filter((r) => r.check_in_at && !r.check_out_at).length
  const done = records.filter((r) => r.check_out_at).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Team Attendance</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">In: {present} · Done: {done}</span>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-auto" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No attendance for this day.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">In</th>
                  <th className="py-2 pr-4 font-medium">Out</th>
                  <th className="py-2 pr-4 font-medium">Worked</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Photos</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.user?.full_name || r.user?.email || "—"}</td>
                    <td className="py-2 pr-4">{formatTime(r.check_in_at)}</td>
                    <td className="py-2 pr-4">{formatTime(r.check_out_at)}</td>
                    <td className="py-2 pr-4">{formatDuration(r.worked_minutes)}</td>
                    <td className="py-2 pr-4">
                      <Badge className={`${statusClasses(r.status)} border-0`}>{ATTENDANCE_STATUS_LABELS[r.status]}</Badge>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        {r.check_in_photo_path && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Check-in selfie" onClick={() => viewPhoto(r.id, "in")}>
                            <Camera className="h-4 w-4" />
                          </Button>
                        )}
                        {r.check_out_photo_path && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Check-out selfie" onClick={() => viewPhoto(r.id, "out")}>
                            <Camera className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
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
