"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Notification = { id: string; message: string; read: boolean; created_at: string; type: string; board_id: string | null; item_id: string | null; metadata: Record<string, any> }

export default function NotificationsPage() {
  const params = useParams<{ id: string }>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"all" | "unread">("all")

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("notifications").select("id, message, read, created_at, type, board_id, item_id, metadata").order("created_at", { ascending: false }).limit(100)
    setNotifications((data as Notification[]) || [])
  }, [])
  useEffect(() => { load() }, [load])

  const visible = useMemo(() => notifications.filter((item) => (mode === "all" || !item.read) && item.message.toLowerCase().includes(query.toLowerCase())), [notifications, query, mode])
  const mark = async (id: string, read: boolean) => { const supabase = createClient(); await supabase.from("notifications").update({ read }).eq("id", id); setNotifications((current) => current.map((item) => item.id === id ? { ...item, read } : item)) }
  const markAll = async () => { const supabase = createClient(); await supabase.from("notifications").update({ read: true }).eq("read", false); setNotifications((current) => current.map((item) => ({ ...item, read: true }))) }

  return <AppShell><div className="max-w-4xl mx-auto space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-[#0A1628]">Notifications</h1><p className="text-sm text-muted-foreground">Stay up to date with mentions, assignments, and approvals.</p></div><Button variant="outline" onClick={markAll}>Mark all read</Button></div><Card><CardHeader><div className="flex flex-wrap gap-2"><Button variant={mode === "all" ? "secondary" : "outline"} size="sm" onClick={() => setMode("all")}>All</Button><Button variant={mode === "unread" ? "secondary" : "outline"} size="sm" onClick={() => setMode("unread")}>Unread</Button><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notifications" className="max-w-xs" /></div></CardHeader><CardContent className="space-y-2">{visible.length === 0 ? <p className="text-sm text-muted-foreground">No matching notifications.</p> : visible.map((item) => <div key={item.id} className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${item.read ? "" : "bg-[#D4AF37]/10"}`}><Link href={item.board_id ? `/workspace/${params.id}/board/${item.board_id}${item.item_id ? `?item=${item.item_id}` : ""}` : "#"} onClick={() => mark(item.id, true)} className="flex-1"><p className="text-sm font-medium">{item.message}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p></Link><div className="flex items-center gap-2"><Badge variant="secondary">{item.metadata?.kind || item.type}</Badge><Button variant="ghost" size="sm" onClick={() => mark(item.id, !item.read)}>{item.read ? "Mark unread" : "Mark read"}</Button></div></div>)}</CardContent></Card></div></AppShell>
}
