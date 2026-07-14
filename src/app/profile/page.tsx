"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ full_name: string | null; email: string; id: string } | null>(null)
  const [fullName, setFullName] = useState("")

  useEffect(() => {
    const supabase = createClient()
    const fetchProfile = async () => {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) return
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.user.id)
        .single()
      if (data) {
        setProfile(data as any)
        setFullName((data as any).full_name || "")
      }
    }
    fetchProfile()
  }, [])

  const save = async () => {
    if (!profile) return
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id)
    if (error) toast.error("Failed to update profile")
    else toast.success("Profile updated")
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0A1628] mb-6">Profile</h1>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle>Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button onClick={save} className="bg-[#0A1628]">Save changes</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
