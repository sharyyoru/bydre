"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Instagram,
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { AgentInstagramAccount } from "@/lib/compliance/types"

interface ConnectInstagramProps {
  workspaceId: string
  accounts: AgentInstagramAccount[]
  onAccountConnected: () => void
  onSyncAccount: (accountId: string) => void
  syncing: string | null
}

export function ConnectInstagram({
  workspaceId,
  accounts,
  onAccountConnected,
  onSyncAccount,
  syncing,
}: ConnectInstagramProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [accessToken, setAccessToken] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!accessToken.trim()) {
      toast.error("Please enter an access token")
      return
    }

    setConnecting(true)
    try {
      const res = await fetch("/api/compliance/instagram/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          access_token: accessToken.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to connect account")
      }

      setAccessToken("")
      setIsOpen(false)
      onAccountConnected()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect")
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    setDeleting(accountId)
    try {
      const res = await fetch("/api/compliance/instagram/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: accountId,
          workspace_id: workspaceId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to disconnect")
      }

      toast.success("Account disconnected")
      onAccountConnected()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Connected Instagram Accounts
              </CardTitle>
              <CardDescription>
                Connect agent Instagram accounts to monitor their posts for QR compliance
              </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Instagram Account</DialogTitle>
                  <DialogDescription>
                    Enter a long-lived access token from Meta Business Suite to connect an Instagram Business account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Access Token</Label>
                    <Input
                      id="token"
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste your long-lived access token"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium mb-1">How to get an access token:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Go to Meta Business Suite</li>
                      <li>Navigate to Settings → Business Assets → System Users</li>
                      <li>Create or select a system user</li>
                      <li>Generate a token with instagram_basic and pages_read_engagement permissions</li>
                    </ol>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Instagram className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No Instagram accounts connected yet</p>
              <p className="text-sm">Connect an account to start monitoring posts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    {account.profile_picture_url ? (
                      <img
                        src={account.profile_picture_url}
                        alt={account.username || "Profile"}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Instagram className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        @{account.username || account.instagram_user_id}
                      </div>
                      {account.display_name && (
                        <div className="text-sm text-muted-foreground">
                          {account.display_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {account.status === "connected" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {account.status}
                          </Badge>
                        )}
                        {account.last_synced_at && (
                          <span className="text-xs text-muted-foreground">
                            Last synced: {new Date(account.last_synced_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSyncAccount(account.id)}
                      disabled={syncing === account.id}
                    >
                      {syncing === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(account.id)}
                      disabled={deleting === account.id}
                    >
                      {deleting === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">OAuth Integration (Coming Soon)</CardTitle>
          <CardDescription>
            One-click Instagram login will be available after Meta app review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Instagram className="h-4 w-4 mr-2" />
            Login with Instagram
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
