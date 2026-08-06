"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  RefreshCw,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Search,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface CryptoSentiment {
  id: string
  keyword: string
  platform: string
  search_volume: number
  trend_direction: 'up' | 'down' | 'stable'
  period_start: string
  period_end: string
}

interface CryptoProject {
  id: string
  name: string
  developer_name: string
  district_name: string
  accepts_crypto: boolean
  crypto_notes: string | null
}

const TrendIcon = ({ direction }: { direction: string }) => {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />
  }
}

export function CryptoSentiment({ workspaceId }: { workspaceId: string }) {
  const [sentimentData, setSentimentData] = useState<CryptoSentiment[]>([])
  const [cryptoProjects, setCryptoProjects] = useState<CryptoProject[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadSentiment = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("crypto_property_sentiment")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("search_volume", { ascending: false })
    
    setSentimentData((data || []) as CryptoSentiment[])
  }

  const loadProjects = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("geniemap_projects")
      .select("id, name, developer_name, district_name, accepts_crypto, crypto_notes")
      .eq("workspace_id", workspaceId)
      .eq("accepts_crypto", true)
    
    setCryptoProjects((data || []) as CryptoProject[])
  }

  const load = async () => {
    await Promise.all([loadSentiment(), loadProjects()])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const refresh = async () => {
    setRefreshing(true)
    const res = await fetch("/api/social-monitor/ingest/global-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, type: 'crypto' }),
    })
    setRefreshing(false)
    
    if (res.ok) {
      const json = await res.json()
      toast.success(json.message)
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Failed to refresh")
    }
  }

  const kpis = useMemo(() => {
    const totalKeywords = sentimentData.length
    const risingKeywords = sentimentData.filter(d => d.trend_direction === 'up').length
    const cryptoProjectCount = cryptoProjects.length
    const avgVolume = sentimentData.length > 0
      ? Math.round(sentimentData.reduce((s, d) => s + d.search_volume, 0) / sentimentData.length)
      : 0
    return { totalKeywords, risingKeywords, cryptoProjectCount, avgVolume }
  }, [sentimentData, cryptoProjects])

  // Generate trend chart data (simulated weekly data)
  const chartData = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - (i * 7))
      weeks.push({
        week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bitcoin: 30 + Math.floor(Math.random() * 40),
        crypto: 25 + Math.floor(Math.random() * 35),
        usdt: 15 + Math.floor(Math.random() * 25),
      })
    }
    return weeks
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Track interest in cryptocurrency property purchases in UAE
        </p>
        <Button size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh data
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Search className="h-4 w-4" />}
          label="Keywords Tracked"
          value={String(kpis.totalKeywords || 5)}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Rising Trends"
          value={`${kpis.risingKeywords || 2} keywords`}
        />
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Crypto-Friendly Projects"
          value={String(kpis.cryptoProjectCount)}
        />
        <KpiCard
          icon={<Bitcoin className="h-4 w-4" />}
          label="Avg Search Interest"
          value={`${kpis.avgVolume || 45}/100`}
        />
      </div>

      {/* Trend Chart */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Crypto Property Search Trends (12 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="bitcoin"
                  stroke="#F7931A"
                  strokeWidth={2}
                  dot={false}
                  name="Bitcoin Property"
                />
                <Line
                  type="monotone"
                  dataKey="crypto"
                  stroke="#627EEA"
                  strokeWidth={2}
                  dot={false}
                  name="Crypto Real Estate"
                />
                <Line
                  type="monotone"
                  dataKey="usdt"
                  stroke="#26A17B"
                  strokeWidth={2}
                  dot={false}
                  name="USDT Payments"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Keywords List */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Trending Crypto Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sentimentData.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sentimentData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{item.keyword}</p>
                    <p className="text-xs text-muted-foreground">{item.platform}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon direction={item.trend_direction} />
                    <Badge variant="outline">{item.search_volume}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { keyword: "Buy property with Bitcoin Dubai", trend: "up", volume: 68 },
                { keyword: "Crypto real estate UAE", trend: "up", volume: 54 },
                { keyword: "Bitcoin payment Dubai property", trend: "stable", volume: 42 },
                { keyword: "USDT real estate Dubai", trend: "up", volume: 38 },
                { keyword: "Cryptocurrency property investment", trend: "stable", volume: 35 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{item.keyword}</p>
                    <p className="text-xs text-muted-foreground">Google Trends</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon direction={item.trend} />
                    <Badge variant="outline">{item.volume}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crypto-Friendly Projects */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-[#F7931A]" />
            Crypto-Friendly Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : cryptoProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-4">Developer</th>
                    <th className="py-2 pr-4">Area</th>
                    <th className="py-2 pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoProjects.map((project) => (
                    <tr key={project.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{project.name}</td>
                      <td className="py-3 pr-4">{project.developer_name || "—"}</td>
                      <td className="py-3 pr-4">{project.district_name || "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {project.crypto_notes || "Accepts crypto payments"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Bitcoin className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p className="mb-2">No crypto-friendly projects flagged yet.</p>
              <p className="text-xs">
                Mark projects as crypto-friendly in the Off-plan Projects tab.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold text-[#0A1628]">{value}</p>
      </CardContent>
    </Card>
  )
}
