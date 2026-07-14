"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (password.length < 12 || password !== confirmPassword) {
      toast.error("Use a matching password with at least 12 characters")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase.auth.updateUser({ password, data: { ...auth.user?.user_metadata, must_change_password: false } })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success("Password updated")
    router.replace("/dashboard")
    router.refresh()
  }

  return <main className="min-h-screen grid place-items-center bg-dre-surface p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Set your password</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">You must set a new password before accessing the workspace.</p><div className="space-y-2"><Label>New password</Label><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="space-y-2"><Label>Confirm password</Label><PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div><Button onClick={save} disabled={saving} className="w-full bg-[#0A1628]">{saving ? "Updating..." : "Continue"}</Button></CardContent></Card></main>
}
