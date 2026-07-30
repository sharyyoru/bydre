"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Save, Loader2 } from "lucide-react"
import { AttendanceSettings, LeaveType, WEEKDAY_LABELS } from "@/lib/attendance/types"

interface Props {
  workspaceId: string
  settings: AttendanceSettings
  leaveTypes: LeaveType[]
  onSaved: (s: AttendanceSettings) => void
  onLeaveTypesChanged: () => void
}

export function SettingsPanel({ workspaceId, settings, leaveTypes, onSaved, onLeaveTypesChanged }: Props) {
  const [form, setForm] = useState<AttendanceSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [newType, setNewType] = useState({ name: "", quota: "0" })

  const set = <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleWeekend = (day: number) => {
    const has = form.weekend_days.includes(day)
    set("weekend_days", (has ? form.weekend_days.filter((d) => d !== day) : [...form.weekend_days, day]).sort())
  }

  const save = async () => {
    setSaving(true)
    try {
      const { workspace_id: _omit, created_at: _c, updated_at: _u, ...rest } = form
      void _omit; void _c; void _u
      const res = await fetch("/api/attendance/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, ...rest }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(j.error || "Could not save")
        return
      }
      onSaved(j.settings)
      toast.success("Settings saved")
    } finally {
      setSaving(false)
    }
  }

  const addType = async () => {
    if (!newType.name) {
      toast.error("Enter a leave type name")
      return
    }
    const res = await fetch("/api/attendance/leave-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        name: newType.name,
        code: newType.name,
        annual_quota: Number(newType.quota) || 0,
        position: leaveTypes.length,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error || "Could not add type")
      return
    }
    setNewType({ name: "", quota: "0" })
    onLeaveTypesChanged()
  }

  const updateQuota = async (id: string, quota: number) => {
    await fetch("/api/attendance/leave-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id, annual_quota: quota }),
    })
    onLeaveTypesChanged()
  }

  const removeType = async (id: string) => {
    const res = await fetch("/api/attendance/leave-types", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id }),
    })
    if (res.ok) onLeaveTypesChanged()
    else toast.error("Could not delete (may be in use)")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Shift & Capture</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Work start</label>
              <Input type="time" value={form.work_start.slice(0, 5)} onChange={(e) => set("work_start", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Work end</label>
              <Input type="time" value={form.work_end.slice(0, 5)} onChange={(e) => set("work_end", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Grace (min)</label>
              <Input type="number" value={form.grace_minutes} onChange={(e) => set("grace_minutes", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Timezone</label>
              <Input value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Full day (min)</label>
              <Input type="number" value={form.full_day_minutes} onChange={(e) => set("full_day_minutes", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Half day threshold (min)</label>
              <Input type="number" value={form.half_day_minutes} onChange={(e) => set("half_day_minutes", Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Weekend days</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {WEEKDAY_LABELS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekend(i)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    form.weekend_days.includes(i) ? "border-[#0A1628] bg-[#0A1628] text-white" : "text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Require selfie on check-in</span>
            <Switch checked={form.require_selfie} onCheckedChange={(v) => set("require_selfie", v)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Capture geolocation</span>
            <Switch checked={form.capture_geo} onCheckedChange={(v) => set("capture_geo", v)} />
          </div>

          <Button onClick={save} disabled={saving} className="w-full gap-2 bg-[#0A1628] hover:bg-[#0A1628]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Leave Types</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {leaveTypes.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
              <span className="flex-1 text-sm font-medium">{t.name}</span>
              <Input
                type="number"
                defaultValue={t.annual_quota}
                className="h-8 w-20"
                onBlur={(e) => {
                  const v = Number(e.target.value)
                  if (v !== t.annual_quota) updateQuota(t.id, v)
                }}
              />
              <span className="text-xs text-muted-foreground">days/yr</span>
              <button onClick={() => removeType(t.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Input placeholder="New type name" value={newType.name} onChange={(e) => setNewType((n) => ({ ...n, name: e.target.value }))} />
            <Input type="number" value={newType.quota} onChange={(e) => setNewType((n) => ({ ...n, quota: e.target.value }))} className="w-20" />
            <Button size="icon" onClick={addType} className="shrink-0 bg-[#0A1628] hover:bg-[#0A1628]/90"><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
