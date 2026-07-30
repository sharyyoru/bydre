"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogIn, LogOut, Coffee, Loader2, Clock } from "lucide-react"
import { AttendanceRecord, AttendanceSettings, ATTENDANCE_STATUS_LABELS } from "@/lib/attendance/types"
import { CaptureModal, CaptureResult } from "./capture-modal"
import { formatDuration, formatTime, statusClasses } from "./format"

interface Props {
  workspaceId: string
  settings: AttendanceSettings
  record: AttendanceRecord | null
  onChanged: (record: AttendanceRecord) => void
}

export function CheckInCard({ workspaceId, settings, record, onChanged }: Props) {
  const [now, setNow] = useState(new Date())
  const [modal, setModal] = useState<null | "in" | "out">(null)
  const [submitting, setSubmitting] = useState(false)
  const [breakBusy, setBreakBusy] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const checkedIn = !!record?.check_in_at
  const checkedOut = !!record?.check_out_at
  const onBreak = !!record?.break_started_at

  const submitCapture = async (which: "in" | "out", result: CaptureResult) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/attendance/check-${which}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, ...result }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(j.error || "Action failed")
        return
      }
      onChanged(j.record)
      toast.success(which === "in" ? "Checked in" : "Checked out")
      setModal(null)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleBreak = async () => {
    setBreakBusy(true)
    try {
      const res = await fetch("/api/attendance/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, action: onBreak ? "stop" : "start" }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(j.error || "Break action failed")
        return
      }
      onChanged(j.record)
    } finally {
      setBreakBusy(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-3xl font-bold tabular-nums text-[#0A1628]">
            <Clock className="h-6 w-6 text-[#D4AF37]" />
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>

          {checkedIn && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span>In: <strong>{formatTime(record?.check_in_at)}</strong></span>
              {checkedOut && <span>Out: <strong>{formatTime(record?.check_out_at)}</strong></span>}
              {checkedOut && <span>Worked: <strong>{formatDuration(record?.worked_minutes)}</strong></span>}
              {record && (
                <Badge className={`${statusClasses(record.status)} border-0`}>
                  {ATTENDANCE_STATUS_LABELS[record.status]}
                </Badge>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {!checkedIn && (
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setModal("in")}>
                <LogIn className="h-5 w-5" /> Check In
              </Button>
            )}
            {checkedIn && !checkedOut && (
              <>
                <Button size="lg" className="gap-2 bg-[#0A1628] hover:bg-[#0A1628]/90" onClick={() => setModal("out")}>
                  <LogOut className="h-5 w-5" /> Check Out
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={toggleBreak} disabled={breakBusy}>
                  {breakBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Coffee className="h-5 w-5" />}
                  {onBreak ? "End Break" : "Start Break"}
                </Button>
              </>
            )}
            {checkedOut && (
              <p className="text-sm font-medium text-emerald-700">You&apos;re done for today. See you tomorrow!</p>
            )}
          </div>
          {onBreak && <p className="text-xs text-amber-600">On break…</p>}
        </div>
      </CardContent>

      <CaptureModal
        open={modal !== null}
        title={modal === "out" ? "Check Out" : "Check In"}
        requireSelfie={settings.require_selfie}
        captureGeo={settings.capture_geo}
        submitting={submitting}
        onCancel={() => setModal(null)}
        onConfirm={(result) => modal && submitCapture(modal, result)}
      />
    </Card>
  )
}
