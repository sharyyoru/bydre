"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format, eachDayOfInterval, endOfMonth, isSameDay, isSameMonth, parseISO, startOfMonth } from "date-fns"

type Event = { itemId: string; boardId: string; boardName: string; boardType: string; title: string; date: string; dateType: string }

export function WorkspaceCalendarView({ workspaceId, workspaceSlug }: { workspaceId: string; workspaceSlug: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [boards, setBoards] = useState<{ id: string; name: string; type: string }[]>([])
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: boardData } = await supabase.from("boards").select("id,name,type").eq("workspace_id", workspaceId).is("archived_at", null)
      const boardList = (boardData || []) as { id: string; name: string; type: string }[]
      setBoards(boardList)
      const ids = boardList.map((board) => board.id)
      if (!ids.length) return
      const [{ data: columns }, { data: items }] = await Promise.all([
        supabase.from("columns").select("id,board_id,name,type").in("board_id", ids).eq("type", "date").is("archived_at", null),
        supabase.from("items").select("id,title,board_id,item_values(column_id,value)").in("board_id", ids).is("archived_at", null),
      ])
      const boardById = Object.fromEntries(boardList.map((board) => [board.id, board]))
      const dateColumns = (columns || []) as any[]
      const columnById = Object.fromEntries(dateColumns.map((column) => [column.id, column]))
      const next: Event[] = []
      for (const item of (items || []) as any[]) {
        for (const value of item.item_values || []) {
          const column = columnById[value.column_id]
          if (column && value.value) next.push({ itemId: item.id, boardId: item.board_id, boardName: boardById[item.board_id]?.name || "Board", boardType: boardById[item.board_id]?.type || "tasks", title: item.title, date: value.value, dateType: column.name })
        }
      }
      setEvents(next)
    }
    load()
  }, [workspaceId])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const visible = useMemo(() => events.filter((event) => (!selectedBoards.length || selectedBoards.includes(event.boardId)) && `${event.title} ${event.boardName} ${event.dateType}`.toLowerCase().includes(query.toLowerCase())), [events, selectedBoards, query])
  const color = (type: string) => type === "shoots" ? "bg-[#D4AF37]/20" : type === "content" ? "bg-pink-100" : "bg-blue-100"

  return <AppShell><div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-[#0A1628]">Workspace calendar</h1><p className="text-sm text-muted-foreground">All board dates in one view.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Previous</Button><Button variant="outline" onClick={() => setMonth(new Date())}>Today</Button><Button variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next</Button></div></div><div className="flex flex-wrap gap-2"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search calendar" className="w-56" />{boards.map((board) => <Button key={board.id} size="sm" variant={selectedBoards.includes(board.id) ? "secondary" : "outline"} onClick={() => setSelectedBoards((current) => current.includes(board.id) ? current.filter((id) => id !== board.id) : [...current, board.id])}>{board.name}</Button>)}</div><div className="grid grid-cols-7 gap-2"><>{"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((day) => <div key={day} className="text-center text-xs font-medium text-muted-foreground">{day}</div>)}</>{days.map((day) => <div key={day.toISOString()} className={`min-h-28 rounded-xl border p-2 ${isSameMonth(day, month) ? "bg-white" : "bg-muted/20"}`}><p className="text-sm font-medium">{format(day, "d")}</p>{visible.filter((event) => isSameDay(parseISO(event.date), day)).map((event) => <Link key={`${event.itemId}-${event.dateType}`} href={`/workspace/${workspaceSlug}/board/${event.boardId}?item=${event.itemId}`}><Badge className={`mt-1 w-full justify-start truncate border-0 text-xs text-[#0A1628] ${color(event.boardType)}`}>{event.title} · {event.dateType}</Badge></Link>)}</div>)}</div></div></AppShell>
}
