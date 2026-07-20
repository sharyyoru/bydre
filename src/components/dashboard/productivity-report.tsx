"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Task = { id: string; title: string; due_date: string | null; priority: string; item_assignees: { user_id: string; profiles: { full_name: string | null; email: string } }[] }
type WorkspaceMember = { user_id: string; role: string; profiles: { id: string; full_name: string | null; email: string } }

export function ProductivityReport() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      // Get current workspace (use first workspace if not in workspace route)
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .single()

      if (!workspace) {
        setTasks([])
        setMembers([])
        return
      }

      const wsId = (workspace as { id: string }).id

      // Get all board IDs in this workspace
      const { data: boards } = await supabase
        .from("boards")
        .select("id")
        .eq("workspace_id", wsId)
        .is("archived_at", null)

      const boardIds = (boards || []).map((b: any) => b.id)

      if (boardIds.length === 0) {
        setTasks([])
        setMembers([])
        return
      }

      // Fetch all non-archived top-level items in workspace boards
      const { data } = await supabase
        .from("items")
        .select("id,title,due_date,priority,item_assignees(user_id,profiles(full_name,email))")
        .in("board_id", boardIds)
        .is("archived_at", null)
        .is("parent_id", null)

      setTasks(
        ((data || []) as any[]).map((task) => ({
          ...task,
          item_assignees: (task.item_assignees || []).map((assignee: any) => ({
            ...assignee,
            profiles: Array.isArray(assignee.profiles) ? assignee.profiles[0] : assignee.profiles,
          })),
        })) as Task[]
      )

      // Fetch all workspace members for workload view
      const { data: membersData } = await supabase
        .from("workspace_members")
        .select("user_id, role, profiles(id, full_name, email)")
        .eq("workspace_id", wsId)

      setMembers(
        ((membersData || []) as any[]).map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        })) as WorkspaceMember[]
      )
    }

    load()
  }, [])

  const scoped = useMemo(() => tasks.filter((task) => {
    if (!task.due_date) return false
    const date = new Date(`${task.due_date}T00:00:00`)
    return (!customStart || date >= new Date(`${customStart}T00:00:00`)) && (!customEnd || date <= new Date(`${customEnd}T00:00:00`))
  }), [tasks, customStart, customEnd])

  const overdue = useMemo(() => scoped.filter((task) => task.due_date && new Date(`${task.due_date}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0))).length, [scoped])

  const workload = useMemo(() => {
    const counts = new Map<string, number>()

    // Initialize all workspace members with 0 tasks so they appear in the report
    members.forEach((member) => {
      const displayName = member.profiles?.full_name || member.profiles?.email || member.user_id
      counts.set(displayName, 0)
    })

    // Count tasks per assignee
    scoped.forEach((task) => {
      task.item_assignees?.forEach((assignee) => {
        const displayName = assignee.profiles?.full_name || assignee.profiles?.email || assignee.user_id
        counts.set(displayName, (counts.get(displayName) || 0) + 1)
      })
    })

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [scoped, members])

  const maxCount = workload.length > 0 ? workload[0][1] : 0

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Productivity & Workload</CardTitle>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="productivity-start-date">Start date</label>
          <input id="productivity-start-date" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="h-9 rounded-md border px-2 text-sm" />
          <label className="sr-only" htmlFor="productivity-end-date">End date</label>
          <input id="productivity-end-date" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="h-9 rounded-md border px-2 text-sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Tasks in scope" value={scoped.length} />
          <Metric label="Overdue" value={overdue} />
          <Metric label="Unassigned" value={scoped.filter((task) => !task.item_assignees?.length).length} />
        </div>
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">Workload by user</p>
          {workload.length ? (
            <div className="space-y-3">
              {workload.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{name}</span>
                    <span>{count} tasks</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-[#D4AF37]" style={{ width: `${maxCount > 0 ? Math.max(12, (count / maxCount) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No assigned dated tasks in this range.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border bg-muted/20 p-4"><p className="text-2xl font-bold text-[#0A1628]">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div> }
