"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, X, Loader2, CalendarPlus } from "lucide-react"
import { DAY_PORTION_LABELS, LeaveBalance, LeaveRequest, LeaveType, LEAVE_STATUS_LABELS } from "@/lib/attendance/types"
import { formatDate } from "./format"

interface Props {
  workspaceId: string
  isAdmin: boolean
  leaveTypes: LeaveType[]
}

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
}

export function LeavePanel({ workspaceId, isAdmin, leaveTypes }: Props) {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [mine, setMine] = useState<LeaveRequest[]>([])
  const [pending, setPending] = useState<LeaveRequest[]>([])
  const [busy, setBusy] = useState(false)

  const [typeId, setTypeId] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [portion, setPortion] = useState("full")
  const [reason, setReason] = useState("")

  const load = useCallback(async () => {
    const [b, m, p] = await Promise.all([
      fetch(`/api/attendance/balances?workspace_id=${workspaceId}`),
      fetch(`/api/attendance/leaves?workspace_id=${workspaceId}`),
      isAdmin
        ? fetch(`/api/attendance/leaves?workspace_id=${workspaceId}&scope=all&status=pending`)
        : Promise.resolve(null),
    ])
    if (b.ok) setBalances((await b.json()).balances || [])
    if (m.ok) setMine((await m.json()).requests || [])
    if (p && p.ok) setPending((await p.json()).requests || [])
  }, [workspaceId, isAdmin])

  useEffect(() => {
    load()
  }, [load])

  const apply = async () => {
    if (!typeId || !start || !end) {
      toast.error("Pick a leave type and dates")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          leave_type_id: typeId,
          start_date: start,
          end_date: end,
          day_portion: start === end ? portion : "full",
          reason,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(j.error || "Could not submit request")
        return
      }
      toast.success("Leave request submitted")
      setStart(""); setEnd(""); setReason(""); setPortion("full")
      load()
    } finally {
      setBusy(false)
    }
  }

  const review = async (id: string, action: "approve" | "reject") => {
    const res = await fetch("/api/attendance/leaves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id, action }),
    })
    if (!res.ok) {
      toast.error("Action failed")
      return
    }
    toast.success(action === "approve" ? "Approved" : "Rejected")
    load()
  }

  const cancel = async (id: string) => {
    const res = await fetch("/api/attendance/leaves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id, action: "cancel" }),
    })
    if (!res.ok) {
      toast.error("Could not cancel")
      return
    }
    load()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Balances */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Leave Balances ({new Date().getFullYear()})</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {balances.length === 0 && <p className="text-sm text-muted-foreground">No leave types configured.</p>}
          {balances.map((b) => (
            <div key={b.leave_type_id} className="min-w-[140px] rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                <span className="text-sm font-medium">{b.name}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-[#0A1628]">{b.remaining}</p>
              <p className="text-xs text-muted-foreground">of {b.quota + b.adjustments} · used {b.used}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Apply */}
      <Card>
        <CardHeader><CardTitle className="text-base">Apply for Leave</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={typeId} onValueChange={setTypeId}>
            <SelectTrigger><SelectValue placeholder="Leave type" /></SelectTrigger>
            <SelectContent>
              {leaveTypes.filter((t) => t.active).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={start} onChange={(e) => { setStart(e.target.value); if (!end) setEnd(e.target.value) }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {start && start === end && (
            <Select value={portion} onValueChange={setPortion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DAY_PORTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          <Button onClick={apply} disabled={busy} className="w-full gap-2 bg-[#0A1628] hover:bg-[#0A1628]/90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Submit Request
          </Button>
        </CardContent>
      </Card>

      {/* My requests */}
      <Card>
        <CardHeader><CardTitle className="text-base">My Requests</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {mine.length === 0 && <p className="text-sm text-muted-foreground">No leave requests yet.</p>}
          {mine.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
              <div>
                <p className="font-medium">{r.leave_type?.name || "Leave"} · {r.days} day(s)</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.start_date)} → {formatDate(r.end_date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${statusBadge[r.status]} border-0`}>{LEAVE_STATUS_LABELS[r.status]}</Badge>
                {r.status === "pending" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => cancel(r.id)}>Cancel</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Admin approvals */}
      {isAdmin && (
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Pending Approvals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                <div>
                  <p className="font-medium">{r.user?.full_name || r.user?.email} — {r.leave_type?.name} · {r.days} day(s)</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.start_date)} → {formatDate(r.end_date)}{r.reason ? ` · ${r.reason}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => review(r.id, "approve")}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => review(r.id, "reject")}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
