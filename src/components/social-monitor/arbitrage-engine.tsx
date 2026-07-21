"use client"

import { useState } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sparkles, Zap, Loader2 } from "lucide-react"
import { ArbitrageOpportunity } from "@/lib/social-monitor/types"
import { formatAED } from "@/lib/social-monitor/format"

export function ArbitrageEngine({ workspaceId }: { workspaceId: string }) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [narrative, setNarrative] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [ran, setRan] = useState(false)

  const analyze = async (withNarrative: boolean) => {
    setLoading(true)
    const res = await fetch("/api/social-monitor/arbitrage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, narrative: withNarrative }),
    })
    setLoading(false)
    setRan(true)
    if (res.ok) {
      const json = await res.json()
      setOpportunities(json.opportunities || [])
      setNarrative(json.narrative || null)
      if (json.narrativeError === "gemini not configured") {
        toast.error("Gemini not configured — add your key in API Settings for AI narrative")
      }
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Analysis failed")
    }
  }

  const generateBrief = async (opp: ArbitrageOpportunity) => {
    setGenerating(opp.market_metric_id)
    const res = await fetch("/api/social-monitor/briefs/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, opportunity: opp }),
    })
    setGenerating(null)
    if (res.status === 501) {
      toast.error("Gemini not configured — add your key in API Settings")
      return
    }
    if (res.ok) {
      toast.success("Brief generated — see Content Pipeline")
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Generation failed")
    }
  }

  const scatterData = opportunities.map((o) => ({
    x: o.market_strength,
    y: o.sentiment_level,
    z: o.arbitrage_score,
    name: o.area_name,
  }))

  const scoreColor = (score: number) => {
    if (score >= 66) return "#059669"
    if (score >= 33) return "#D97706"
    return "#DC2626"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Correlates market strength with social sentiment to surface <strong>Quiet Performers</strong> — high-value areas with low buzz.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => analyze(false)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
            Run analysis
          </Button>
          <Button size="sm" onClick={() => analyze(true)} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-1" />
            Analyze + AI narrative
          </Button>
        </div>
      </div>

      {narrative && (
        <Card className="rounded-2xl border-border/60 bg-[#0A1628] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              AI Market Narrative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">{narrative}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Arbitrage map (market strength vs sentiment)</CardTitle>
        </CardHeader>
        <CardContent>
          {scatterData.length ? (
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Market strength" domain={[0, 100]} tick={{ fontSize: 12 }}>
                </XAxis>
                <YAxis type="number" dataKey="y" name="Sentiment" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <ZAxis type="number" dataKey="z" range={[60, 400]} name="Score" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: any, name: any) => [value, name]}
                  labelFormatter={() => ""}
                  content={({ payload }) => {
                    const p = payload?.[0]?.payload
                    if (!p) return null
                    return (
                      <div className="rounded-lg border bg-white p-2 text-xs shadow">
                        <p className="font-semibold">{p.name}</p>
                        <p>Market: {p.x}</p>
                        <p>Sentiment: {p.y}</p>
                        <p>Score: {p.z}</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={scoreColor(d.z)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Zap className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p>{ran ? "No opportunities found. Add market & sentiment data first." : "Run analysis to compute opportunities."}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {opportunities.length > 0 && (
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Quiet Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Area</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Market</th>
                    <th className="py-2 pr-4">Sentiment</th>
                    <th className="py-2 pr-4">Value (AED)</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => (
                    <tr key={o.market_metric_id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{o.area_name}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{o.registration_type === "off_plan" ? "Off-plan" : "Ready"}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                          style={{ backgroundColor: scoreColor(o.arbitrage_score) }}
                        >
                          {o.arbitrage_score}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{o.market_strength}</td>
                      <td className="py-2 pr-4">{o.sentiment_level}</td>
                      <td className="py-2 pr-4">{formatAED(o.total_value_aed)}</td>
                      <td className="py-2 pr-4">
                        <Button size="sm" onClick={() => generateBrief(o)} disabled={generating === o.market_metric_id}>
                          {generating === o.market_metric_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" />
                              Generate brief
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
