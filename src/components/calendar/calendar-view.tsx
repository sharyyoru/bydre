"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns"

type Item = {
  id: string
  title: string
  due_date: string | null
  priority: "low" | "medium" | "high" | "urgent"
  status_id: string | null
}

type Board = { id: string; name: string; type: "shoots" | "content" | "tasks" }

export function CalendarView({ workspaceId, board }: { workspaceId: string; board: Board }) {
  const [items, setItems] = useState<Item[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    const supabase = createClient()
    const fetchItems = async () => {
      const { data } = await supabase
        .from("items")
        .select("id, title, due_date, priority, status_id")
        .eq("board_id", board.id)
        .not("due_date", "is", null)

      setItems((data as Item[]) || [])
    }

    fetchItems()
  }, [board.id])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const itemsForDay = (day: Date) =>
    items.filter((item) => item.due_date && isSameDay(parseISO(item.due_date), day))

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
                <p>No items with due dates yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
