"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { RefreshCw, Plus, TrendingUp } from "lucide-react"
import { SentimentMetric } from "@/lib/social-monitor/types"
import { formatNumber } from "@/lib/social-monitor/format"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function monthAgoISO() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

export function SentimentTracker({ workspaceId }: { workspaceId: string }) {
  const [rows, setRows] = useState<SentimentMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [keywords, setKeywords] = useState("")
  const [showManual, setShowManual] = useState(false)
  const [form, setForm] = useState({
    keyword: "",
    platform: "google_trends",
    search_volume: "",
    velocity: "",
    engagement_score: "",
    period_start: monthAgoISO(),
    period_end: todayISO(),
  })

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("social_sentiment_metrics")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("ingested_at", { ascending: false })
    setRows((data || []) as SentimentMetric[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const trendsRows = useMemo(() => rows.filter((r) => r.platform === "google_trends"), [rows])
  const youtubeRows = useMemo(() => rows.filter((r) => r.platform === "youtube"), [rows])

  const volumeChart = useMemo(
    () =>
      trendsRows
        .map((r) => ({ keyword: r.keyword, volume: r.search_volume || 0 }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10),
    [trendsRows]
  )

  const engagementChart = useMemo(
    () =>
      youtubeRows
        .map((r) => ({ keyword: r.keyword, engagement: r.engagement_score || 0 }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10),
    [youtubeRows]
  )

  const refresh = async () => {
    const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean)
    if (!kws.length) {
      toast.error("Enter one or more keywords (comma-separated)")
      return
    }
    setRefreshing(true)
    const res = await fetch("/api/social-monitor/ingest/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        keywords: kws,
        geo: "AE",
        period_start: monthAgoISO(),
        period_end: todayISO(),
      }),
    })
    setRefreshing(false)
    if (res.status === 501) {
      toast.error("SerpApi/YouTube not configured — add keys in API Settings")
      return
    }
    if (res.ok) {
      const json = await res.json()
      toast.success(`Ingested ${json.inserted} rows`)
      if (json.warnings?.length) toast.message(json.warnings.join(", "))
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Ingestion failed")
    }
  }

  const submitManual = async () => {
    if (!form.keyword.trim()) {
      toast.error("Keyword required")
      return
    }
    const res = await fetch("/api/social-monitor/metrics/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, kind: "sentiment", rows: [form] }),
    })
    if (res.ok) {
      toast.success("Entry added")
      setShowManual(false)
      setForm((f) => ({ ...f, keyword: "", search_volume: "", velocity: "", engagement_score: "" }))
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Failed to add")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Keywords (comma-separated) e.g. Dubai Marina, JVC"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowManual((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" />
            Manual entry
          </Button>
          <Button size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh data
          </Button>
        </div>
      </div>

      {showManual && (
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Manual sentiment entry</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Keyword" value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} />
            <select
              className="h-10 rounded-md border bg-background px-2 text-sm"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            >
              <option value="google_trends">Google Trends</option>
              <option value="youtube">YouTube</option>
            </select>
            <Input type="number" placeholder="Search volume" value={form.search_volume} onChange={(e) => setForm((f) => ({ ...f, search_volume: e.target.value }))} />
            <Input type="number" placeholder="Velocity" value={form.velocity} onChange={(e) => setForm((f) => ({ ...f, velocity: e.target.value }))} />
            <Input type="number" placeholder="Engagement score" value={form.engagement_score} onChange={(e) => setForm((f) => ({ ...f, engagement_score: e.target.value }))} />
            <div className="flex gap-2">
              <Input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
              <Input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
            </div>
            <div>
              <Button size="sm" onClick={submitManual}>Add entry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Search volume by keyword (Google Trends)</CardTitle>
          </CardHeader>
          <CardContent>
            {volumeChart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={volumeChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="keyword" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base">YouTube engagement by keyword</CardTitle>
          </CardHeader>
          <CardContent>
            {engagementChart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={engagementChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="keyword" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => formatNumber(Number(v))} />
                  <Bar dataKey="engagement" fill="#DC2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Keyword data</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Keyword</th>
                    <th className="py-2 pr-4">Platform</th>
                    <th className="py-2 pr-4">Volume</th>
                    <th className="py-2 pr-4">Velocity</th>
                    <th className="py-2 pr-4">Engagement</th>
                    <th className="py-2 pr-4">Videos</th>
                    <th className="py-2 pr-4">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{r.keyword}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{r.platform === "youtube" ? "YouTube" : "Trends"}</Badge>
                      </td>
                      <td className="py-2 pr-4">{r.search_volume != null ? formatNumber(r.search_volume) : "—"}</td>
                      <td className="py-2 pr-4">{r.velocity != null ? r.velocity : "—"}</td>
                      <td className="py-2 pr-4">{r.engagement_score != null ? formatNumber(r.engagement_score) : "—"}</td>
                      <td className="py-2 pr-4">{r.video_count != null ? r.video_count : "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-50" />
      <p>No sentiment data yet. Add a manual entry or connect SerpApi/YouTube in API Settings.</p>
    </div>
  )
}
