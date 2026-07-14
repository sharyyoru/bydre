"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type ActivityEvent = {
  id: string
  event_type: string
  entity_type: string
  created_at: string
  before_data: Record<string, any> | null
  after_data: Record<string, any> | null
  metadata: Record<string, any> | null
  profiles: { email: string; full_name: string | null } | null
}

export function ActivityLog({ boardId, itemId }: { boardId?: string; itemId?: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let request = supabase
      .from("activity_events")
      .select("id, event_type, entity_type, created_at, before_data, after_data, metadata, profiles(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(100)

    if (itemId) request = request.eq("item_id", itemId)
    else if (boardId) request = request.eq("board_id", boardId)

    const { data } = await request
    setEvents(((data || []) as unknown) as ActivityEvent[])
    setLoading(false)
  }, [boardId, itemId])

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel(`activity-${itemId || boardId || "workspace"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [boardId, itemId, load])

  const visible = events.filter((event) => {
    const person = event.profiles?.full_name || event.profiles?.email || "system"
    return `${event.event_type} ${event.entity_type} ${person} ${event.metadata?.column_name || ""}`.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter activity" />
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1">
        {loading ? <p className="text-sm text-muted-foreground">Loading activity...</p> : null}
        {!loading && visible.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : null}
        {visible.map((event) => <ActivityRow key={event.id} event={event} />)}
      </div>
    </div>
  )
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const person = event.profiles?.full_name || event.profiles?.email || (event.event_type.includes("automation") ? "Automation" : "System")
  const field = event.metadata?.column_name as string | undefined
  const before = readable(event.before_data?.value ?? event.before_data?.title)
  const after = readable(event.after_data?.value ?? event.after_data?.title)

  return (
    <div className="border-b border-border/60 pb-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{person} <span className="font-normal">{event.event_type.replaceAll(".", " ").replaceAll("_", " ")}</span></p>
          {field && <Badge variant="secondary" className="mt-1">{field}</Badge>}
          {(before || after) && <p className="text-xs text-muted-foreground mt-1">{before || "Empty"} → {after || "Empty"}</p>}
        </div>
        <time className="text-xs text-muted-foreground whitespace-nowrap">{new Date(event.created_at).toLocaleString()}</time>
      </div>
    </div>
  )
}

function readable(value: unknown) {
  if (value === null || value === undefined || value === "") return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}
