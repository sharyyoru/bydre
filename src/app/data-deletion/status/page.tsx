"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Clock, Loader2, AlertCircle, Search } from "lucide-react"
import Link from "next/link"

interface StatusData {
  status: string
  requested_at: string
  completed_at: string | null
}

function StatusChecker() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get("code") || ""
  
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(!!initialCode)
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [error, setError] = useState("")

  const checkStatus = async (confirmationCode: string) => {
    if (!confirmationCode) {
      setError("Please enter a confirmation code")
      return
    }

    setLoading(true)
    setError("")
    setStatusData(null)

    try {
      const res = await fetch(`/api/data-deletion?code=${encodeURIComponent(confirmationCode)}`)
      const data = await res.json()

      if (res.ok) {
        setStatusData(data)
      } else {
        setError(data.error || "Request not found")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCode) {
      checkStatus(initialCode)
    }
  }, [initialCode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkStatus(code)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      case "pending":
      case "processing":
        return <Clock className="h-8 w-8 text-amber-600" />
      case "failed":
        return <AlertCircle className="h-8 w-8 text-red-600" />
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100"
      case "pending":
      case "processing":
        return "bg-amber-100"
      case "failed":
        return "bg-red-100"
      default:
        return "bg-muted"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Deletion Complete"
      case "pending":
        return "Pending Review"
      case "processing":
        return "Processing"
      case "failed":
        return "Failed"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-8 w-8 text-slate-600" />
          </div>
          <CardTitle className="text-xl">Check Deletion Status</CardTitle>
          <CardDescription>
            Enter your confirmation code to check the status of your data deletion request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Confirmation Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="DEL-XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          </form>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {statusData && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${getStatusColor(statusData.status)}`}>
                  {getStatusIcon(statusData.status)}
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-semibold">{getStatusText(statusData.status)}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested:</span>
                  <span>{new Date(statusData.requested_at).toLocaleDateString()}</span>
                </div>
                {statusData.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{new Date(statusData.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {statusData.status === "completed" && (
                <p className="text-xs text-muted-foreground text-center">
                  Your data has been successfully deleted from our systems.
                </p>
              )}
            </div>
          )}

          <div className="text-center pt-4">
            <Link href="/data-deletion" className="text-sm text-primary underline">
              Submit a new deletion request
            </Link>
          </div>
        </CardContent>
      </Card>

      <footer className="fixed bottom-4 text-center text-xs text-muted-foreground">
        <p>DreHomes &copy; {new Date().getFullYear()} | <a href="/privacy" className="underline">Privacy Policy</a></p>
      </footer>
    </div>
  )
}

export default function DeletionStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <StatusChecker />
    </Suspense>
  )
}
