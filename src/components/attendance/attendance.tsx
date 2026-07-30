"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { resolveWorkspaceId } from "@/lib/workspace-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Clock, CalendarDays, Users, BarChart3, Settings as SettingsIcon, Plane } from "lucide-react"
import { AttendanceRecord, AttendanceSettings, LeaveType } from "@/lib/attendance/types"
import { CheckInCard } from "./check-in-card"
import { Timesheet } from "./timesheet"
import { LeavePanel } from "./leave-panel"
import { HolidaysPanel } from "./holidays-panel"
import { TeamAttendance } from "./team-attendance"
import { ReportsPanel } from "./reports-panel"
import { SettingsPanel } from "./settings-panel"

export function Attendance({ workspaceId: workspaceIdentifier }: { workspaceId: string }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<AttendanceSettings | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [today, setToday] = useState<AttendanceRecord | null>(null)
  const [tsKey, setTsKey] = useState(0)
  const [tab, setTab] = useState("me")

  useEffect(() => {
    const supabase = createClient()
    resolveWorkspaceId(supabase, workspaceIdentifier).then((id) => setWorkspaceId(id))
  }, [workspaceIdentifier])

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: auth }) => {
      if (!auth.user) return
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", auth.user.id)
        .maybeSingle()
        .then(({ data }) => setIsAdmin((data as { role?: string } | null)?.role === "admin"))
    })
  }, [workspaceId])

  const loadLeaveTypes = useCallback(async () => {
    if (!workspaceId) return
    const res = await fetch(`/api/attendance/leave-types?workspace_id=${workspaceId}`)
    if (res.ok) setLeaveTypes((await res.json()).leave_types || [])
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    ;(async () => {
      const [s, r] = await Promise.all([
        fetch(`/api/attendance/settings?workspace_id=${workspaceId}`),
        fetch(`/api/attendance/records?workspace_id=${workspaceId}`),
      ])
      if (s.ok) setSettings((await s.json()).settings)
      if (r.ok) {
        const data = await r.json()
        const todayStr = data.today as string
        setToday((data.records || []).find((x: AttendanceRecord) => x.work_date === todayStr) || null)
      }
      loadLeaveTypes()
    })()
  }, [workspaceId, loadLeaveTypes])

  const onRecordChanged = (record: AttendanceRecord) => {
    setToday(record)
    setTsKey((k) => k + 1)
  }

  if (!workspaceId || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Attendance</h1>
        <p className="text-sm text-muted-foreground">Check in/out, track your timesheet, and manage leave.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="me" className="gap-1.5"><Clock className="h-4 w-4" /> My Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5"><Plane className="h-4 w-4" /> Leave</TabsTrigger>
          <TabsTrigger value="holidays" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Holidays</TabsTrigger>
          {isAdmin && <TabsTrigger value="team" className="gap-1.5"><Users className="h-4 w-4" /> Team</TabsTrigger>}
          {isAdmin && <TabsTrigger value="reports" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Reports</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings" className="gap-1.5"><SettingsIcon className="h-4 w-4" /> Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="me" className="mt-4 space-y-4">
          <CheckInCard workspaceId={workspaceId} settings={settings} record={today} onChanged={onRecordChanged} />
          <Timesheet workspaceId={workspaceId} refreshKey={tsKey} />
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <LeavePanel workspaceId={workspaceId} isAdmin={isAdmin} leaveTypes={leaveTypes} />
        </TabsContent>

        <TabsContent value="holidays" className="mt-4">
          <HolidaysPanel workspaceId={workspaceId} isAdmin={isAdmin} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="team" className="mt-4">
            <TeamAttendance workspaceId={workspaceId} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="reports" className="mt-4">
            <ReportsPanel workspaceId={workspaceId} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="settings" className="mt-4">
            <SettingsPanel
              workspaceId={workspaceId}
              settings={settings}
              leaveTypes={leaveTypes}
              onSaved={setSettings}
              onLeaveTypesChanged={loadLeaveTypes}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
