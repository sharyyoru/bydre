"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  RefreshCw,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface GlobalSentiment {
  id: string
  country_code: string
  country_name: string
  search_interest: number
  trend_direction: 'up' | 'down' | 'stable'
  trending_keywords: string[]
  period_start: string
  period_end: string
}

// Country flag emoji helper
const getFlag = (code: string) => {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
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

export function GlobalDemand({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<GlobalSentiment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data: rows } = await supabase
      .from("global_investment_sentiment")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("search_interest", { ascending: false })
    
    setData((rows || []) as GlobalSentiment[])
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
      body: JSON.stringify({ workspace_id: workspaceId, type: 'property' }),
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

  const chartData = useMemo(() => {
    return data.slice(0, 10).map(d => ({
      country: d.country_name,
      interest: d.search_interest,
      code: d.country_code,
    }))
  }, [data])

  const kpis = useMemo(() => {
    const totalCountries = data.length
    const risingCount = data.filter(d => d.trend_direction === 'up').length
    const topCountry = data[0]?.country_name || "—"
    const avgInterest = data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.search_interest, 0) / data.length)
      : 0
    return { totalCountries, risingCount, topCountry, avgInterest }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Track worldwide interest in UAE property investment
        </p>
        <Button size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh data
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Globe className="h-4 w-4" />}
          label="Countries Tracked"
          value={String(kpis.totalCountries)}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Rising Interest"
          value={`${kpis.risingCount} countries`}
        />
        <KpiCard
          icon={<MapPin className="h-4 w-4" />}
          label="Top Source"
          value={kpis.topCountry}
        />
        <KpiCard
          icon={<Globe className="h-4 w-4" />}
          label="Avg Interest"
          value={`${kpis.avgInterest}/100`}
        />
      </div>

      {/* Chart */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Search Interest by Country</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="country"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${getFlag(chartData.find(d => d.country === value)?.code || '')} ${value}`}
                />
                <Tooltip
                  formatter={(value) => [`${value}/100`, "Interest"]}
                />
                <Bar dataKey="interest" fill="#0A1628" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState onRefresh={refresh} />
          )}
        </CardContent>
      </Card>

      {/* Country List */}
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">All Countries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Country</th>
                    <th className="py-2 pr-4">Interest</th>
                    <th className="py-2 pr-4">Trend</th>
                    <th className="py-2 pr-4">Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 pr-4 font-medium">
                        <span className="mr-2">{getFlag(row.country_code)}</span>
                        {row.country_name}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0A1628] rounded-full"
                              style={{ width: `${row.search_interest}%` }}
                            />
                          </div>
                          <span>{row.search_interest}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1">
                          <TrendIcon direction={row.trend_direction} />
                          <span className="capitalize text-xs">{row.trend_direction}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(row.trending_keywords || []).slice(0, 2).map((kw, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState onRefresh={refresh} />
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

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <Globe className="mx-auto mb-3 h-8 w-8 opacity-50" />
      <p className="mb-4">No global sentiment data yet.</p>
      <Button size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Load Global Data
      </Button>
    </div>
  )
}
