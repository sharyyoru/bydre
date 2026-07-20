"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

type TaskAssignee = {
  user_id: string
  role: "shooter" | "editor" | "reviewer" | "other"
  profiles?: {
    full_name: string | null
    email: string
  }
}

type WorkspaceMember = {
  user_id: string
  profiles: {
    full_name: string | null
    email: string
  }
}

const ROLE_COLORS: Record<string, string> = {
  shooter: "bg-blue-100 text-blue-800",
  editor: "bg-purple-100 text-purple-800",
  reviewer: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
}

export function MultiOwnerSelect({
  itemId,
  workspaceId,
  onAssigneesChange,
}: {
  itemId: string
  workspaceId: string
  onAssigneesChange?: (assignees: TaskAssignee[]) => void
}) {
  const [assignees, setAssignees] = useState<TaskAssignee[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<"shooter" | "editor" | "reviewer" | "other">("other")

  useEffect(() => {
    fetchData()
  }, [itemId, workspaceId])

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch current assignees
    const { data: assigneeData } = await supabase
      .from("task_assignees")
      .select(`
        user_id,
        role,
        profiles(full_name, email)
      `)
      .eq("item_id", itemId)

    setAssignees(
      ((assigneeData || []) as any[]).map((a) => ({
        user_id: a.user_id,
        role: a.role,
        profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      }))
    )

    // Fetch workspace members
    const { data: memberData } = await supabase
      .from("workspace_members")
      .select(`
        user_id,
        profiles(full_name, email)
      `)
      .eq("workspace_id", workspaceId)

    setMembers(
      ((memberData || []) as any[]).map((m) => ({
        user_id: m.user_id,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      }))
    )
    setLoading(false)
  }

  const addAssignee = async (userId: string, role: "shooter" | "editor" | "reviewer" | "other") => {
    const supabase = createClient()

    const { error } = await supabase.from("task_assignees").insert({
      item_id: itemId,
      user_id: userId,
      role,
    })

    if (!error) {
      await fetchData()
      onAssigneesChange?.(assignees)
    }
  }

  const removeAssignee = async (userId: string, role: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("task_assignees")
      .delete()
      .eq("item_id", itemId)
      .eq("user_id", userId)
      .eq("role", role)

    if (!error) {
      await fetchData()
      onAssigneesChange?.(assignees)
    }
  }

  const isAssigned = (userId: string) => assignees.some(a => a.user_id === userId)

  if (loading) {
    return <div className="text-xs text-muted-foreground">Loading...</div>
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {assignees.map((assignee) => (
        <Badge
          key={`${assignee.user_id}-${assignee.role}`}
          className={`${ROLE_COLORS[assignee.role]} cursor-pointer flex items-center gap-1`}
        >
          <span className="text-xs">
            {assignee.profiles?.full_name || assignee.profiles?.email || "Unknown"}
          </span>
          <span className="text-xs opacity-70">({assignee.role})</span>
          <button
            onClick={() => removeAssignee(assignee.user_id, assignee.role)}
            className="ml-1 hover:opacity-70"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 text-xs">
            + Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Select Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["shooter", "editor", "reviewer", "other"] as const).map((role) => (
            <DropdownMenuCheckboxItem
              key={role}
              checked={selectedRole === role}
              onCheckedChange={() => setSelectedRole(role)}
              className="capitalize"
            >
              {role}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Assign to {selectedRole}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {members.map((member) => (
            <DropdownMenuCheckboxItem
              key={member.user_id}
              checked={isAssigned(member.user_id)}
              onCheckedChange={() => {
                if (isAssigned(member.user_id)) {
                  removeAssignee(member.user_id, selectedRole)
                } else {
                  addAssignee(member.user_id, selectedRole)
                }
              }}
            >
              {member.profiles?.full_name || member.profiles?.email}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
