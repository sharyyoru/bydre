"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ full_name: string | null; email: string; id: string } | null>(null)
  const [fullName, setFullName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

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

  const changePassword = async () => {
    if (!profile || !currentPassword || newPassword.length < 12 || newPassword !== confirmPassword) {
      toast.error("Enter your current password and matching new password with at least 12 characters")
      return
    }
    setChangingPassword(true)
    const supabase = createClient()
    const { error: verificationError } = await supabase.auth.signInWithPassword({ email: profile.email, password: currentPassword })
    if (verificationError) {
      setChangingPassword(false)
      toast.error("Current password is incorrect")
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast.success("Password changed")
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

        <Card className="rounded-2xl border-border/60 mt-6">
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Current password</Label><PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>New password</Label><PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>Confirm new password</Label><PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <Button onClick={changePassword} disabled={changingPassword} className="bg-[#0A1628]">{changingPassword ? "Changing..." : "Change password"}</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
