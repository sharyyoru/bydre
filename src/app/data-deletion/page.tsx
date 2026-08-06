"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2, Trash2 } from "lucide-react"

export default function DataDeletionPage() {
  const [email, setEmail] = useState("")
  const [instagramHandle, setInstagramHandle] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch("/api/data-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          instagram_handle: instagramHandle,
          reason,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        setConfirmationCode(data.confirmation_code || "")
      } else {
        setError(data.error || "Failed to submit request. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Request Submitted</CardTitle>
            <CardDescription>
              Your data deletion request has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              We will process your request within <strong>30 days</strong> as required by applicable data protection regulations.
            </p>
            
            {confirmationCode && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground mb-1">Your confirmation code:</p>
                <p className="font-mono font-bold text-lg">{confirmationCode}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to <strong>{email}</strong>.
              Please save your confirmation code for your records.
            </p>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false)
                  setEmail("")
                  setInstagramHandle("")
                  setReason("")
                }}
              >
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Data Deletion Request</CardTitle>
          <CardDescription>
            Request deletion of your Instagram connection data from DreHomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The email associated with your account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Handle (optional)</Label>
              <Input
                id="instagram"
                type="text"
                placeholder="@yourusername"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Tell us why you want to delete your data..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Deletion Request"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              By submitting this request, you acknowledge that all your connected Instagram account data will be permanently deleted from our systems.
            </p>
          </form>
        </CardContent>
      </Card>

      <footer className="fixed bottom-4 text-center text-xs text-muted-foreground">
        <p>DreHomes &copy; {new Date().getFullYear()} | <a href="/privacy" className="underline">Privacy Policy</a></p>
      </footer>
    </div>
  )
}
