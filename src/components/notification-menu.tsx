"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell } from "lucide-react"

type Notification = { id: string; message: string; read: boolean; created_at: string; board_id: string | null; item_id: string | null }

export function NotificationMenu() {
  const [items, setItems] = useState<Notification[]>([])
  const [workspaceSlug, setWorkspaceSlug] = useState("drehomes")

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: notifications }, { data: workspace }] = await Promise.all([
      supabase.from("notifications").select("id, message, read, created_at, board_id, item_id").order("created_at", { ascending: false }).limit(10),
      supabase.from("workspaces").select("slug").limit(1).maybeSingle(),
    ])
    setItems((notifications as Notification[]) || [])
    if (workspace) setWorkspaceSlug(workspace.slug)
  }, [])

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase.channel("notification-menu").on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item))
  }
  const markAllRead = async () => {
    const supabase = createClient()
    await supabase.from("notifications").update({ read: true }).eq("read", false)
    setItems((current) => current.map((item) => ({ ...item, read: true })))
  }
  const unread = items.filter((item) => !item.read).length

  return <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5 text-[#0A1628]" />{unread > 0 && <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#D4AF37] text-[10px] font-bold text-[#0A1628] flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}</Button></PopoverTrigger><PopoverContent align="end" className="w-96 p-0"><div className="flex items-center justify-between p-3 border-b"><span className="font-semibold">Notifications</span><Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button></div><div className="max-h-80 overflow-y-auto">{items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p> : items.map((item) => { const href = item.board_id ? `/workspace/${workspaceSlug}/board/${item.board_id}${item.item_id ? `?item=${item.item_id}` : ""}` : `/workspace/${workspaceSlug}/notifications`; return <Link key={item.id} href={href} onClick={() => markRead(item.id)} className={`block p-3 border-b hover:bg-muted/50 ${item.read ? "" : "bg-[#D4AF37]/10"}`}><p className="text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p></Link> })}</div><div className="p-2 border-t"><Link href={`/workspace/${workspaceSlug}/notifications`} className="block text-center text-sm font-medium text-[#D4AF37]">View all notifications</Link></div></PopoverContent></Popover>
}
