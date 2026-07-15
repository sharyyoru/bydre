"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns"
import { ColumnDefinition } from "@/lib/board/columns"

type Item = {
  id: string
  title: string
  values: Record<string, any>
  priority: "low" | "medium" | "high" | "urgent"
  status_id: string | null
}

type Board = { id: string; name: string; type: "shoots" | "content" | "tasks"; default_view: string }

export function CalendarView({ workspaceId, board }: { workspaceId: string; board: Board }) {
  const [items, setItems] = useState<Item[]>([])
  const [columns, setColumns] = useState<ColumnDefinition[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [query, setQuery] = useState(() => searchParams.get("q") || "")
  const [selectedDateColumnId, setSelectedDateColumnId] = useState(() => searchParams.get("dateColumn") || "")

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      const { data: colData } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", board.id)
        .is("archived_at", null)
        .order("position", { ascending: true })

      const typedColumns = (colData as ColumnDefinition[]) || []
      setColumns(typedColumns)
      const urlColumn = searchParams.get("dateColumn")
      if (!urlColumn) setSelectedDateColumnId(typedColumns.find((c) => c.type === "date")?.id || "")

      if (!typedColumns.some((c) => c.type === "date")) return

      const { data } = await supabase
        .from("items")
        .select("id, title, priority, status_id, item_values(column_id, value)")
        .eq("board_id", board.id)
        .is("archived_at", null)

      const typedItems = ((data || []) as any[]).map((item: any) => {
        const values: Record<string, any> = {}
        for (const v of item.item_values || []) {
          values[v.column_id] = v.value
        }
        return { ...item, values }
      }) as Item[]

      setItems(typedItems)
    }

    fetchData()
  }, [board.id])

  const dateColumns = columns.filter((c) => c.type === "date")
  const dateColumnId = selectedDateColumnId || dateColumns[0]?.id
  const dateColumn = dateColumns.find((column) => column.id === dateColumnId)

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const visibleItems = useMemo(() => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [items, query])
  const updateUrl = (key: string, value: string) => { const next = new URLSearchParams(window.location.search); if (value) next.set(key, value); else next.delete(key); router.replace(`${pathname}${next.size ? `?${next}` : ""}`) }
  const itemsForDay = (day: Date) =>
    dateColumnId
      ? visibleItems.filter((item) => item.values?.[dateColumnId] && isSameDay(parseISO(item.values[dateColumnId]), day))
      : []

  const priorityColor = (p: string) => {
    switch (p) {
      case "low":
        return "bg-slate-100 text-slate-700"
      case "medium":
        return "bg-blue-100 text-blue-700"
      case "high":
        return "bg-[#D4AF37]/10 text-[#D4AF37]"
      case "urgent":
        return "bg-red-100 text-red-700"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">
              {board.name} — Calendar
            </h1>
            <p className="text-sm text-muted-foreground">
              Items with due dates
            </p>
          </div>
          <Link href={`/workspace/${workspaceId}/board/${board.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to board
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2"><Input value={query} onChange={(event) => { setQuery(event.target.value); updateUrl("q", event.target.value) }} placeholder="Search calendar" className="w-56" /><select value={dateColumnId || ""} onChange={(event) => { setSelectedDateColumnId(event.target.value); updateUrl("dateColumn", event.target.value) }} className="h-10 rounded-md border bg-background px-2 text-sm">{dateColumns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}</select></div>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((d) => (
                <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dayItems = itemsForDay(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] rounded-xl border p-2 ${
                      isSameMonth(day, currentMonth)
                        ? "bg-white border-border/60"
                        : "bg-muted/20 border-transparent text-muted-foreground"
                    }`}
                  >
                    <div className="text-sm font-medium mb-2">{format(day, "d")}</div>
                    <div className="space-y-1">
                      {dayItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/workspace/${workspaceId}/board/${board.id}?item=${item.id}`}
                        >
                          <Badge
                            variant="outline"
                            className={`w-full justify-start truncate text-xs ${priorityColor(item.priority)} border-0 cursor-pointer`}
                          >
                            {item.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>
                  {dateColumn
                    ? `No items with ${dateColumn.name} set yet.`
                    : "No date column configured for this board."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
