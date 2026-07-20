"use client"

import { AppShell } from "@/components/app-shell"
import { SidebarMyTasks } from "@/components/sidebar-my-tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo } from "lucide-react"

export default function MyTasksPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628] flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            My Tasks
          </h1>
          <p className="text-muted-foreground">
            All tasks assigned to you across all boards
          </p>
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <SidebarMyTasks />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
