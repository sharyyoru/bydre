"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductivityReport } from "@/components/dashboard/productivity-report"
import {
  Camera,
  FileText,
  CheckSquare,
  Calendar,
  Bell,
  ArrowRight,
} from "lucide-react"

type Board = {
  id: string
  name: string
  type: "shoots" | "content" | "tasks"
  item_count: number
}

type Notification = {
  id: string
  message: string
  read: boolean
  created_at: string
}

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [workspaceSlug, setWorkspaceSlug] = useState("drehomes")

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("slug")
        .limit(1)
        .single()

      if (workspace) {
        setWorkspaceSlug((workspace as { slug: string }).slug)
      }

      const { data: boardData } = await supabase
        .from("boards")
        .select("id, name, type")
        .order("position", { ascending: true })

      if (boardData) {
        const boardsWithCount = await Promise.all(
          (boardData as Omit<Board, "item_count">[]).map(async (board) => {
            const { count } = await supabase
              .from("items")
              .select("*", { count: "exact", head: true })
              .eq("board_id", board.id)
            return { ...board, item_count: count || 0 }
          })
        )
        setBoards(boardsWithCount)
      }

      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, message, read, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

      setNotifications((notifData as Notification[]) || [])
    }

    fetchData()
  }, [])

  const boardIcon = (type: string) => {
    switch (type) {
      case "shoots":
        return <Camera className="h-5 w-5" />
      case "content":
        return <FileText className="h-5 w-5" />
      case "tasks":
        return <CheckSquare className="h-5 w-5" />
      default:
        return <CheckSquare className="h-5 w-5" />
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your DreHomes workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Card key={board.id} className="rounded-2xl border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#0A1628]/5 text-[#0A1628]">
                    {boardIcon(board.type)}
                  </div>
                  <Badge variant="secondary">{board.item_count} items</Badge>
                </div>
                <CardTitle className="text-lg mt-3">{board.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/workspace/${workspaceSlug}/board/${board.id}`}>
                  <Button variant="ghost" className="p-0 h-auto text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium">
                    Open board <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          <Card className="rounded-2xl border-dashed border-border/60 bg-transparent">
            <CardHeader>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] w-fit">
                <Calendar className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg mt-3">Calendar view</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/workspace/${workspaceSlug}/calendar`}>
                <Button variant="ghost" className="p-0 h-auto text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium">
                  View all calendars <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {boards.length === 0 && (
            <Card className="rounded-2xl border-dashed border-border/60 col-span-1 md:col-span-3 bg-white">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No boards found. Make sure you ran the Supabase seed script
                  (<code>supabase/seed.sql</code>) after creating the test user.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <ProductivityReport />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#D4AF37]" />
                <CardTitle className="text-lg">Recent notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`text-sm p-3 rounded-lg border ${
                        n.read ? "bg-muted/30" : "bg-[#D4AF37]/5 border-[#D4AF37]/20"
                      }`}
                    >
                      {n.message}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
