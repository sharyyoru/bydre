"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plug, KeyRound, Check, Trash2, Copy, Plus } from "lucide-react"

type Provider = "gemini" | "dubai_pulse" | "serpapi" | "youtube"

interface CredentialStatus {
  provider: Provider
  configured: boolean
  last_four?: string
  is_active?: boolean
  config?: Record<string, unknown>
  updated_at?: string
}

interface FeedToken {
  id: string
  name: string
  revoked_at: string | null
  created_at: string
}

const PROVIDER_META: Record<Provider, { label: string; hint: string; hasBaseUrl?: boolean }> = {
  gemini: { label: "Google Gemini", hint: "LLM for arbitrage analysis & content generation" },
  dubai_pulse: { label: "Dubai Pulse / DLD", hint: "Market transaction data", hasBaseUrl: true },
  serpapi: { label: "SerpApi", hint: "Google Trends search volume & velocity" },
  youtube: { label: "YouTube Data API v3", hint: "YouTube engagement signals" },
}

export function ApiSettings({ workspaceId }: { workspaceId: string }) {
  const [creds, setCreds] = useState<CredentialStatus[]>([])
  const [secrets, setSecrets] = useState<Record<string, string>>({})
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const [tokens, setTokens] = useState<FeedToken[]>([])
  const [tokenName, setTokenName] = useState("")
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const loadCreds = async () => {
    const res = await fetch(`/api/social-monitor/credentials?workspace_id=${workspaceId}`)
    if (res.ok) {
      const json = await res.json()
      setCreds(json.credentials)
      const urls: Record<string, string> = {}
      for (const c of json.credentials as CredentialStatus[]) {
        if (c.config && typeof (c.config as any).base_url === "string") {
          urls[c.provider] = (c.config as any).base_url
        }
      }
      setBaseUrls(urls)
    } else if (res.status === 403) {
      toast.error("Admin access required")
    }
    setLoading(false)
  }

  const loadTokens = async () => {
    const res = await fetch(`/api/social-monitor/feed-tokens?workspace_id=${workspaceId}`)
    if (res.ok) {
      const json = await res.json()
      setTokens(json.tokens)
    }
  }

  useEffect(() => {
    loadCreds()
    loadTokens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const saveCredential = async (provider: Provider) => {
    const secret = secrets[provider]
    const meta = PROVIDER_META[provider]
    const config: Record<string, unknown> = {}
    if (meta.hasBaseUrl && baseUrls[provider]) config.base_url = baseUrls[provider]

    if (!secret && !Object.keys(config).length) {
      toast.error("Enter an API key first")
      return
    }

    setSaving(provider)
    const res = await fetch("/api/social-monitor/credentials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, provider, secret: secret || undefined, config }),
    })
    setSaving(null)
    if (res.ok) {
      toast.success(`${meta.label} saved`)
      setSecrets((s) => ({ ...s, [provider]: "" }))
      loadCreds()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Failed to save")
    }
  }

  const removeCredential = async (provider: Provider) => {
    if (!window.confirm(`Remove ${PROVIDER_META[provider].label} credential?`)) return
    const res = await fetch("/api/social-monitor/credentials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, provider }),
    })
    if (res.ok) {
      toast.success("Removed")
      loadCreds()
    } else {
      toast.error("Failed to remove")
    }
  }

  const createToken = async () => {
    if (!tokenName.trim()) {
      toast.error("Enter a token name")
      return
    }
    const res = await fetch("/api/social-monitor/feed-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, name: tokenName.trim() }),
    })
    if (res.ok) {
      const json = await res.json()
      setNewSecret(json.secret)
      setTokenName("")
      loadTokens()
    } else {
      toast.error("Failed to create token")
    }
  }

  const revokeToken = async (id: string) => {
    if (!window.confirm("Revoke this feed token? External workers using it will lose access.")) return
    const res = await fetch("/api/social-monitor/feed-tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id }),
    })
    if (res.ok) {
      toast.success("Revoked")
      loadTokens()
    } else {
      toast.error("Failed to revoke")
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const statusFor = (provider: Provider) => creds.find((c) => c.provider === provider)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Plug className="h-6 w-6 text-[#0A1628]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">API Settings</h1>
          <p className="text-sm text-muted-foreground">
            Connect external services for Social Monitor. Keys are stored securely and never shown again after saving.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(PROVIDER_META) as Provider[]).map((provider) => {
          const meta = PROVIDER_META[provider]
          const status = statusFor(provider)
          return (
            <Card key={provider} className="rounded-2xl border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    {meta.label}
                  </span>
                  {status?.configured ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Not configured</Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{meta.hint}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {status?.configured && status.last_four && (
                  <p className="text-xs text-muted-foreground">
                    Current key ending in <span className="font-mono">••••{status.last_four}</span>
                  </p>
                )}
                {meta.hasBaseUrl && (
                  <Input
                    placeholder="Base URL (config.base_url)"
                    value={baseUrls[provider] || ""}
                    onChange={(e) => setBaseUrls((u) => ({ ...u, [provider]: e.target.value }))}
                  />
                )}
                <Input
                  type="password"
                  placeholder={status?.configured ? "Enter new key to replace" : "Paste API key"}
                  value={secrets[provider] || ""}
                  onChange={(e) => setSecrets((s) => ({ ...s, [provider]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveCredential(provider)} disabled={saving === provider}>
                    {saving === provider ? "Saving..." : status?.configured ? "Update" : "Save"}
                  </Button>
                  {status?.configured && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeCredential(provider)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Syndication Feed Tokens</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tokens authenticate external workers reading the XML/JSON feed. The secret is shown once at creation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {newSecret && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-medium text-emerald-800 mb-1">New token created — copy it now:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-xs">{newSecret}</code>
                <Button size="sm" variant="outline" onClick={() => copy(newSecret)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-emerald-700">
                Feed URL: <code className="font-mono">/api/social-monitor/feed.xml?token={newSecret.slice(0, 8)}…</code>
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Token name (e.g. Zapier worker)"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="max-w-xs"
            />
            <Button size="sm" onClick={createToken}>
              <Plus className="h-4 w-4 mr-1" />
              Create token
            </Button>
          </div>
          <ul className="space-y-2">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span className="text-sm font-medium">
                  {t.name}
                  {t.revoked_at && <span className="ml-2 text-xs text-destructive">(revoked)</span>}
                </span>
                {!t.revoked_at && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokeToken(t.id)}>
                    Revoke
                  </Button>
                )}
              </li>
            ))}
            {tokens.length === 0 && <p className="text-sm text-muted-foreground">No tokens yet.</p>}
          </ul>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
    </div>
  )
}
