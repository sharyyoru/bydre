"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Clapperboard,
  RefreshCw,
  Megaphone,
  Trophy,
  Plug,
  ExternalLink,
  Check,
  Play,
} from "lucide-react"
import { ACTION_LABELS, AdvocacyAction } from "@/lib/reels/types"

type Platform = "instagram" | "facebook" | "tiktok" | "youtube"

interface Account {
  id: string
  platform: Platform
  kind: string
  username: string | null
  external_account_id: string | null
  status: string
}
interface Metric {
  views: number | null
  reach: number | null
  likes: number | null
  comments: number | null
  saves: number | null
  shares: number | null
  captured_at: string
}
interface Post {
  id: string
  platform: Platform
  permalink: string | null
  caption: string | null
  external_id: string | null
  published_at: string | null
  latest_metric: Metric | null
}
interface Task {
  id: string
  action_type: AdvocacyAction
  status: string
  points: number
  amplification_campaigns: {
    instructions: string | null
    social_posts: { caption: string | null; permalink: string | null; platform: string } | null
  } | null
}
interface LeaderRow {
  user_id: string
  name: string
  points: number
}

const PLATFORMS: Platform[] = ["instagram", "facebook", "tiktok", "youtube"]
const num = (n: number | null | undefined) => (n == null ? "—" : Intl.NumberFormat().format(n))

export function ReelsHub({ workspaceId }: { workspaceId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [tab, setTab] = useState("overview")

  // Register-reel form
  const [rPlatform, setRPlatform] = useState<Platform>("instagram")
  const [rPermalink, setRPermalink] = useState("")
  const [rExternalId, setRExternalId] = useState("")
  const [rCaption, setRCaption] = useState("")

  // Add-account form
  const [aPlatform, setAPlatform] = useState<Platform>("instagram")
  const [aKind, setAKind] = useState("brand")
  const [aUsername, setAUsername] = useState("")
  const [aExternalId, setAExternalId] = useState("")

  const load = useCallback(async () => {
    const [accRes, postRes, advRes] = await Promise.all([
      fetch(`/api/reels/accounts?workspace_id=${workspaceId}`),
      fetch(`/api/reels/posts?workspace_id=${workspaceId}`),
      fetch(`/api/reels/advocacy?workspace_id=${workspaceId}`),
    ])
    if (accRes.ok) setAccounts((await accRes.json()).accounts || [])
    if (postRes.ok) setPosts((await postRes.json()).posts || [])
    if (advRes.ok) {
      const j = await advRes.json()
      setTasks(j.tasks || [])
      setLeaderboard(j.leaderboard || [])
    }
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const registerReel = async () => {
    if (!rPermalink && !rExternalId) {
      toast.error("Enter a permalink or external id")
      return
    }
    setBusy("register")
    const res = await fetch("/api/reels/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        platform: rPlatform,
        permalink: rPermalink || undefined,
        external_id: rExternalId || undefined,
        caption: rCaption || undefined,
      }),
    })
    setBusy(null)
    if (res.ok) {
      toast.success("Reel registered")
      setRPermalink("")
      setRExternalId("")
      setRCaption("")
      load()
    } else {
      toast.error((await res.json().catch(() => ({}))).error || "Failed to register")
    }
  }

  const refreshInsights = async (post: Post) => {
    setBusy(post.id)
    const res = await fetch("/api/reels/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, post_id: post.id, mode: "fetch" }),
    })
    setBusy(null)
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success("Insights refreshed")
      load()
    } else if (j.code === "not_configured") {
      toast.error("Connect Meta in API Settings to pull Instagram insights")
    } else {
      toast.error(j.error || "Failed to refresh")
    }
  }

  const startCampaign = async (post: Post) => {
    setBusy(`camp-${post.id}`)
    const res = await fetch("/api/reels/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        social_post_id: post.id,
        instructions: "Share to your Story, repost, and genuinely engage within the next 2 hours.",
        action_types: ["share_story", "repost", "comment"],
      }),
    })
    setBusy(null)
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(`Advocacy campaign started (${j.tasks_created} tasks)`)
      load()
    } else {
      toast.error(j.error || "Failed to start campaign")
    }
  }

  const updateTask = async (task: Task, status: string) => {
    setBusy(task.id)
    const res = await fetch("/api/reels/advocacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id: task.id, status }),
    })
    setBusy(null)
    if (res.ok) {
      load()
    } else {
      toast.error("Failed to update task")
    }
  }

  const addAccount = async () => {
    setBusy("account")
    const res = await fetch("/api/reels/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        platform: aPlatform,
        kind: aKind,
        username: aUsername || undefined,
        external_account_id: aExternalId || undefined,
      }),
    })
    setBusy(null)
    if (res.ok) {
      toast.success("Account connected")
      setAUsername("")
      setAExternalId("")
      load()
    } else {
      toast.error((await res.json().catch(() => ({}))).error || "Failed to add account")
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clapperboard className="h-6 w-6 text-[#0A1628]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Reels Amplification</h1>
          <p className="text-sm text-muted-foreground">
            Grow Reels views organically — real team advocacy, cross-posting, and insights. No bots, no paid boosting.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview"><Play className="h-4 w-4 mr-1" />Reels</TabsTrigger>
          <TabsTrigger value="advocacy">
            <Megaphone className="h-4 w-4 mr-1" />My Advocacy{pendingTasks.length ? ` (${pendingTasks.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="accounts"><Plug className="h-4 w-4 mr-1" />Accounts</TabsTrigger>
        </TabsList>

        {/* ---- Reels overview ---- */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Register a published Reel</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Select value={rPlatform} onValueChange={(v) => setRPlatform(v as Platform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Permalink (public URL)" value={rPermalink} onChange={(e) => setRPermalink(e.target.value)} />
              <Input placeholder="Media/external ID (for insights)" value={rExternalId} onChange={(e) => setRExternalId(e.target.value)} />
              <Button onClick={registerReel} disabled={busy === "register"}>Register</Button>
              <Textarea className="md:col-span-4" placeholder="Caption (optional)" value={rCaption} onChange={(e) => setRCaption(e.target.value)} />
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {posts.map((post) => (
              <Card key={post.id} className="rounded-2xl border-border/60">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{post.platform}</Badge>
                      <span className="truncate text-sm font-medium text-[#0A1628]">
                        {post.caption || "(no caption)"}
                      </span>
                      {post.permalink && (
                        <a href={post.permalink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-[#0A1628]">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Views <b className="text-[#0A1628]">{num(post.latest_metric?.views)}</b></span>
                      <span>Reach <b className="text-[#0A1628]">{num(post.latest_metric?.reach)}</b></span>
                      <span>Likes <b className="text-[#0A1628]">{num(post.latest_metric?.likes)}</b></span>
                      <span>Comments <b className="text-[#0A1628]">{num(post.latest_metric?.comments)}</b></span>
                      <span>Saves <b className="text-[#0A1628]">{num(post.latest_metric?.saves)}</b></span>
                      <span>Shares <b className="text-[#0A1628]">{num(post.latest_metric?.shares)}</b></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {post.platform === "instagram" && post.external_id && (
                      <Button size="sm" variant="outline" onClick={() => refreshInsights(post)} disabled={busy === post.id}>
                        <RefreshCw className="h-4 w-4 mr-1" />Insights
                      </Button>
                    )}
                    <Button size="sm" onClick={() => startCampaign(post)} disabled={busy === `camp-${post.id}`}>
                      <Megaphone className="h-4 w-4 mr-1" />Amplify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && <p className="text-sm text-muted-foreground">No Reels registered yet.</p>}
          </div>
        </TabsContent>

        {/* ---- My advocacy ---- */}
        <TabsContent value="advocacy" className="space-y-4">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Your advocacy tasks</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => {
                const post = task.amplification_campaigns?.social_posts
                return (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-2 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0A1628]">
                        {ACTION_LABELS[task.action_type]} · <span className="text-muted-foreground">+{task.points} pts</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {post?.caption || "Reel"}{post?.permalink ? "" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {post?.permalink && (
                        <a href={post.permalink} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4 mr-1" />Open</Button>
                        </a>
                      )}
                      {task.status === "pending" ? (
                        <>
                          <Button size="sm" onClick={() => updateTask(task, "done")} disabled={busy === task.id}>
                            <Check className="h-4 w-4 mr-1" />Done
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateTask(task, "skipped")} disabled={busy === task.id}>
                            Skip
                          </Button>
                        </>
                      ) : (
                        <Badge className={task.status === "done" ? "bg-emerald-100 text-emerald-700 border-0" : ""} variant={task.status === "done" ? undefined : "outline"}>
                          {task.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
              {tasks.length === 0 && <p className="text-sm text-muted-foreground">No advocacy tasks assigned to you yet.</p>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-amber-500" />Leaderboard</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.map((row, i) => (
                <div key={row.user_id} className="flex items-center justify-between border-b py-2 last:border-0 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-muted-foreground">{i + 1}.</span>
                    {row.name}
                  </span>
                  <span className="font-semibold text-[#0A1628]">{row.points} pts</span>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-sm text-muted-foreground">No points yet — complete advocacy tasks to appear here.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Accounts ---- */}
        <TabsContent value="accounts" className="space-y-4">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Connect an account</CardTitle>
              <p className="text-xs text-muted-foreground">
                Add the brand account and opt-in agent accounts. For Instagram, the external ID is the IG Business user id (used for publishing + insights). API keys live in API Settings.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <Select value={aPlatform} onValueChange={(v) => setAPlatform(v as Platform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={aKind} onValueChange={setAKind}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="@username" value={aUsername} onChange={(e) => setAUsername(e.target.value)} />
              <Input placeholder="External/IG user id" value={aExternalId} onChange={(e) => setAExternalId(e.target.value)} />
              <Button onClick={addAccount} disabled={busy === "account"}>Connect</Button>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {accounts.map((acc) => (
              <Card key={acc.id} className="rounded-2xl border-border/60">
                <CardContent className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="capitalize">{acc.platform}</Badge>
                    <span className="font-medium">{acc.username || acc.external_account_id || "account"}</span>
                    <Badge variant="outline" className="capitalize text-muted-foreground">{acc.kind}</Badge>
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 capitalize">{acc.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts connected yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
