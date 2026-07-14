"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Member = {
  user_id: string
  role: string
  profiles: { email: string; full_name: string | null }
}

export default function SettingsPage() {
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    const supabase = createClient()
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("workspace_members")
        .select("user_id, role, profiles(email, full_name)")
      setMembers(((data || []) as any[]).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        profiles: m.profiles,
      })) as Member[])
    }
    fetchMembers()
  }, [])

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-[#0A1628] mb-6">Workspace settings</h1>
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">
                  {m.profiles?.full_name || m.profiles?.email}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
              </li>
            ))}
          </ul>
          {members.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
        </CardContent>
      </Card>
    </AppShell>
  )
}
