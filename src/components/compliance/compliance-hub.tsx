"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { resolveWorkspaceId } from "@/lib/workspace-client"
import { toast } from "sonner"
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Instagram,
  QrCode,
  RefreshCw,
  Settings,
  Loader2,
  Shield,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectInstagram } from "./connect-instagram"
import { QRCodeManager } from "./qr-code-manager"
import { ComplianceDashboard } from "./compliance-dashboard"
import { AgentInstagramAccount, ComplianceQRCode } from "@/lib/compliance/types"

interface ComplianceStats {
  total_posts: number
  analyzed: number
  compliant: number
  violations: number
  pending: number
  not_applicable: number
  compliance_rate: number
}

export function ComplianceHub({ workspaceId: workspaceIdentifier }: { workspaceId: string }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [accounts, setAccounts] = useState<AgentInstagramAccount[]>([])
  const [qrCodes, setQRCodes] = useState<ComplianceQRCode[]>([])
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchData = useCallback(async (wsId: string) => {
    try {
      // Fetch accounts
      const accountsRes = await fetch(`/api/compliance/instagram/accounts?workspace_id=${wsId}`)
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setAccounts(accountsData.accounts || [])
      }

      // Fetch QR codes
      const qrRes = await fetch(`/api/compliance/qr-codes?workspace_id=${wsId}`)
      if (qrRes.ok) {
        const qrData = await qrRes.json()
        setQRCodes(qrData.qr_codes || [])
      }

      // Fetch stats
      const statsRes = await fetch(`/api/compliance/reports?workspace_id=${wsId}&limit=1000`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const resolvedId = await resolveWorkspaceId(supabase, workspaceIdentifier)
        if (!resolvedId) {
          toast.error("Workspace not found")
          setLoading(false)
          return
        }
        setWorkspaceId(resolvedId)
        await fetchData(resolvedId)
      } catch {
        toast.error("Failed to load workspace")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [workspaceIdentifier, fetchData])

  const handleSyncAccount = async (accountId: string) => {
    if (!workspaceId) return
    
    setSyncing(accountId)
    try {
      const res = await fetch("/api/compliance/sync-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          account_id: accountId,
          limit: 20,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Sync failed")
      }

      const data = await res.json()
      toast.success(
        `Synced ${data.results.posts_synced} posts, ${data.results.violations} violations found`
      )
      
      // Refresh data
      await fetchData(workspaceId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed")
    } finally {
      setSyncing(null)
    }
  }

  const handleAccountConnected = async () => {
    if (workspaceId) {
      await fetchData(workspaceId)
      toast.success("Instagram account connected!")
    }
  }

  const handleQRCodeUpdated = async () => {
    if (workspaceId) {
      await fetchData(workspaceId)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const companyQR = qrCodes.find(qr => qr.type === "company" && qr.is_active)
  const projectQRCount = qrCodes.filter(qr => qr.type === "project" && qr.is_active).length

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          <h1 className="text-lg font-semibold">QR Compliance Monitor</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="accounts">Instagram Accounts</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.compliance_rate ?? 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.compliant ?? 0} compliant of {(stats?.compliant ?? 0) + (stats?.violations ?? 0)} checked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_posts ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.analyzed ?? 0} analyzed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Violations</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.violations ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accounts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {accounts.filter(a => a.status === "connected").length} active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Company QR Code</span>
                    {companyQR ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Set
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Project QR Codes</span>
                    <Badge variant="secondary">{projectQRCount} registered</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setActiveTab("qr-codes")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage QR Codes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Connected Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No Instagram accounts connected yet.
                    </p>
                  ) : (
                    accounts.slice(0, 3).map(account => (
                      <div key={account.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {account.profile_picture_url && (
                            <img
                              src={account.profile_picture_url}
                              alt={account.username || ""}
                              className="h-6 w-6 rounded-full"
                            />
                          )}
                          <span className="text-sm font-medium">
                            @{account.username || account.instagram_user_id}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSyncAccount(account.id)}
                          disabled={syncing === account.id}
                        >
                          {syncing === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setActiveTab("accounts")}
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Manage Accounts
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Violations */}
            {stats && stats.violations > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Recent Violations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {stats.violations} posts require attention
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setActiveTab("dashboard")}
                  >
                    View All Violations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            {workspaceId && <ComplianceDashboard workspaceId={workspaceId} />}
          </TabsContent>

          <TabsContent value="accounts">
            {workspaceId && (
              <ConnectInstagram
                workspaceId={workspaceId}
                accounts={accounts}
                onAccountConnected={handleAccountConnected}
                onSyncAccount={handleSyncAccount}
                syncing={syncing}
              />
            )}
          </TabsContent>

          <TabsContent value="qr-codes">
            {workspaceId && (
              <QRCodeManager
                workspaceId={workspaceId}
                qrCodes={qrCodes}
                onUpdate={handleQRCodeUpdated}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
