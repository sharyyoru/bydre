"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus, Trash2, ShieldCheck } from "lucide-react"

type Member = {
  user_id: string
  role: "admin" | "member"
  joined_at: string
  profiles: { email: string; full_name: string | null }
}

type Activity = {
  id: string
  event_type: string
  created_at: string
  profiles: { email: string; full_name: string | null } | null
  after_data: Record<string, any> | null
}

export default function UsersPage() {
  const params = useParams<{ id: string }>()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)
    const { data: workspace } = isUuid
      ? await supabase.from("workspaces").select("id").eq("id", params.id).maybeSingle()
      : await supabase.from("workspaces").select("id").eq("slug", params.id).maybeSingle()
    if (!workspace) return

    setWorkspaceId(workspace.id)
    const { data: auth } = await supabase.auth.getUser()
    const [{ data: memberData }, { data: ownMembership }] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("user_id, role, joined_at, profiles(email, full_name)")
        .eq("workspace_id", workspace.id)
        .order("joined_at"),
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace.id)
        .eq("user_id", auth.user?.id || "")
        .maybeSingle(),
    ])

    setMembers(((memberData || []) as any[]).map((member) => ({
      ...member,
      profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles,
    })) as Member[])
    const admin = ownMembership?.role === "admin"
    setIsAdmin(admin)

    if (admin) {
      const { data: activityData } = await supabase
        .from("activity_events")
        .select("id, event_type, created_at, after_data, profiles(email, full_name)")
        .eq("workspace_id", workspace.id)
        .like("event_type", "user.%")
        .order("created_at", { ascending: false })
        .limit(25)
      setActivity(((activityData || []) as any[]).map((entry) => ({
        ...entry,
        profiles: Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles,
      })) as Activity[])
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const request = async (method: string, body?: Record<string, any>, userId?: string) => {
    if (!workspaceId) return
    const response = await fetch(`/api/workspaces/${workspaceId}/users${userId ? `?userId=${userId}` : ""}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "Request failed")
  }

  const createUser = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 12) {
      toast.error("Enter a name, email, and a temporary password with at least 12 characters")
      return
    }
    setSaving(true)
    try {
      await request("POST", { fullName, email, password, role })
      toast.success("User created and added to the workspace")
      setOpen(false)
      setFullName("")
      setEmail("")
      setPassword("")
      setRole("member")
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create user")
    } finally {
      setSaving(false)
    }
  }

  const updateRole = async (userId: string, nextRole: "admin" | "member") => {
    try {
      await request("PATCH", { userId, role: nextRole })
      toast.success("Role updated")
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update role")
    }
  }

  const removeUser = async (userId: string) => {
    try {
      await request("DELETE", undefined, userId)
      toast.success("User removed from workspace")
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove user")
    }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Users</h1>
            <p className="text-sm text-muted-foreground">Everyone in this workspace can view and edit every board.</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0A1628]"><UserPlus className="h-4 w-4 mr-2" />Add user</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Temporary password</Label><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Role</Label><Select value={role} onValueChange={(value: "admin" | "member") => setRole(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
                </div>
                <DialogFooter><Button onClick={createUser} disabled={saving} className="bg-[#0A1628]">{saving ? "Creating..." : "Create user"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Workspace members</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between gap-4 border-b last:border-0 py-3">
                <div><p className="font-medium">{member.profiles?.full_name || member.profiles?.email}</p><p className="text-sm text-muted-foreground">{member.profiles?.email} · Joined {new Date(member.joined_at).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-2">
                  {isAdmin ? <Select value={member.role} onValueChange={(value: "admin" | "member") => updateRole(member.user_id, value)}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select> : <Badge variant="secondary" className="capitalize">{member.role}</Badge>}
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => removeUser(member.user_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {isAdmin && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Workspace security activity</CardTitle></CardHeader><CardContent className="space-y-3">{activity.length === 0 ? <p className="text-sm text-muted-foreground">No user-management activity yet.</p> : activity.map((entry) => <div key={entry.id} className="border-b last:border-0 pb-3"><p className="text-sm font-medium">{entry.event_type.replace("user.", "User ").replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{entry.profiles?.full_name || entry.profiles?.email || "System"} · {new Date(entry.created_at).toLocaleString()}</p></div>)}</CardContent></Card>}
      </div>
    </AppShell>
  )
}
