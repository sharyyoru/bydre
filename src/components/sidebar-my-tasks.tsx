"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Circle, AlertCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

type MyTask = {
  id: string
  title: string
  board_id: string
  board_name: string
  status: string
  priority: string
  due_date: string | null
}

export function SidebarMyTasks() {
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [workspaceSlug, setWorkspaceSlug] = useState("drehomes")

  useEffect(() => {
    const fetchMyTasks = async () => {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get workspace slug
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("slug")
        .limit(1)
        .single()

      if (workspace) {
        setWorkspaceSlug((workspace as { slug: string }).slug)
      }

      // Get all items assigned to current user
      const { data: assignedItems } = await supabase
        .from("items")
        .select(`
          id,
          title,
          board_id,
          boards(name),
          values
        `)
        .eq("item_assignees.user_id", user.id)
        .is("archived_at", null)
        .is("parent_id", null)

      if (!assignedItems) return

      // Get status and priority columns to map values
      const { data: columns } = await supabase
        .from("columns")
        .select("id, board_id, name, type, settings")
        .in("type", ["status", "priority"])

      // Build task list with status and priority
      const myTasks: MyTask[] = assignedItems.map((item: any) => {
        const statusCol = columns?.find(c => c.board_id === item.board_id && c.type === "status")
        const priorityCol = columns?.find(c => c.board_id === item.board_id && c.type === "priority")

        const statusValue = statusCol ? item.values?.[statusCol.id] : null
        const priorityValue = priorityCol ? item.values?.[priorityCol.id] : "medium"

        return {
          id: item.id,
          title: item.title,
          board_id: item.board_id,
          board_name: item.boards?.name || "Unknown",
          status: statusValue || "not_started",
          priority: priorityValue || "medium",
          due_date: item.due_date,
        }
      })

      setTasks(myTasks)
    }

    fetchMyTasks()
  }, [])

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.board_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || task.status === statusFilter
      const matchesPriority = !priorityFilter || task.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter])

  // Get unique statuses and priorities for filters
  const statuses = Array.from(new Set(tasks.map(t => t.status)))
  const priorities = Array.from(new Set(tasks.map(t => t.priority)))

  const getStatusIcon = (status: string) => {
    if (status === "done" || status === "Done") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === "in_progress" || status === "In Progress") return <AlertCircle className="h-4 w-4 text-blue-500" />
    return <Circle className="h-4 w-4 text-gray-400" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-500"
      case "high":
        return "text-orange-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-gray-500"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {statuses.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setStatusFilter(null)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  !statusFilter ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "border-border hover:bg-muted"
                }`}
              >
                All
              </button>
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    statusFilter === status ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "border-border hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        {priorities.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Priority</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setPriorityFilter(null)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  !priorityFilter ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "border-border hover:bg-muted"
                }`}
              >
                All
              </button>
              {priorities.map(priority => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    priorityFilter === priority ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "border-border hover:bg-muted"
                  }`}
                >
                  <span className={getPriorityColor(priority)}>●</span> {priority}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {tasks.length === 0 ? "No tasks assigned to you" : "No tasks match filters"}
          </p>
        ) : (
          filteredTasks.map(task => (
            <Link
              key={task.id}
              href={`/workspace/${workspaceSlug}/board/${task.board_id}?item=${task.id}`}
              className="block"
            >
              <div className="p-2 rounded border border-border/60 hover:bg-accent/50 hover:border-border transition-colors group">
                <div className="flex items-start gap-2">
                  {getStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#0A1628] truncate group-hover:text-[#D4AF37]">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.board_name}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)} flex-shrink-0`}>
                    ●
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filteredTasks.length} of {tasks.length} tasks
        </p>
      )}
    </div>
  )
}
