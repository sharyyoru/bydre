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
import { RefreshCw, Plus, Building2 } from "lucide-react"
import { MarketMetric } from "@/lib/social-monitor/types"
import { formatAED, formatAEDCompact, formatNumber, formatPercent } from "@/lib/social-monitor/format"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function monthAgoISO() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

export function MarketPulse({ workspaceId }: { workspaceId: string }) {
  const [rows, setRows] = useState<MarketMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [regFilter, setRegFilter] = useState<"all" | "off_plan" | "ready">("all")
  const [showManual, setShowManual] = useState(false)

  const [form, setForm] = useState({
    area_name: "",
    registration_type: "ready",
    transaction_count: "",
    total_value_aed: "",
    roi_percent: "",
    period_start: monthAgoISO(),
    period_end: todayISO(),
  })

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("dld_market_metrics")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("total_value_aed", { ascending: false })
    setRows((data || []) as MarketMetric[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const filtered = useMemo(
    () => (regFilter === "all" ? rows : rows.filter((r) => r.registration_type === regFilter)),
    [rows, regFilter]
  )

  const kpis = useMemo(() => {
    const totalValue = filtered.reduce((s, r) => s + Number(r.total_value_aed || 0), 0)
    const txCount = filtered.reduce((s, r) => s + Number(r.transaction_count || 0), 0)
    const avg = txCount ? totalValue / txCount : 0
    const roiVals = filtered.map((r) => r.roi_percent).filter((v): v is number => v != null)
    const avgRoi = roiVals.length ? roiVals.reduce((s, v) => s + v, 0) / roiVals.length : null
    return { totalValue, txCount, avg, avgRoi }
  }, [filtered])

  const chartData = useMemo(() => {
    const byArea = new Map<string, number>()
    for (const r of filtered) {
      byArea.set(r.area_name, (byArea.get(r.area_name) || 0) + Number(r.total_value_aed || 0))
    }
    return Array.from(byArea.entries())
      .map(([area, value]) => ({ area, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filtered])

  const refresh = async () => {
    setRefreshing(true)
    const res = await fetch("/api/social-monitor/ingest/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        period_start: monthAgoISO(),
        period_end: todayISO(),
      }),
    })
    setRefreshing(false)
    if (res.status === 501) {
      toast.error("Dubai Pulse not configured — add your key in API Settings")
      return
    }
    if (res.ok) {
      const json = await res.json()
      toast.success(`Ingested ${json.inserted} rows`)
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Ingestion failed")
    }
  }

  const submitManual = async () => {
    if (!form.area_name.trim()) {
      toast.error("Area name required")
      return
    }
    const res = await fetch("/api/social-monitor/metrics/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        kind: "market",
        rows: [form],
      }),
    })
    if (res.ok) {
      toast.success("Entry added")
      setShowManual(false)
      setForm((f) => ({ ...f, area_name: "", transaction_count: "", total_value_aed: "", roi_percent: "" }))
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Failed to add")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["all", "off_plan", "ready"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={regFilter === r ? "default" : "outline"}
              onClick={() => setRegFilter(r)}
            >
              {r === "all" ? "All" : r === "off_plan" ? "Off-plan" : "Ready"}
            </Button>
          ))}
        </div>
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
            <CardTitle className="text-base">Manual market entry (AED)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Area name" value={form.area_name} onChange={(e) => setForm((f) => ({ ...f, area_name: e.target.value }))} />
            <select
              className="h-10 rounded-md border bg-background px-2 text-sm"
              value={form.registration_type}
              onChange={(e) => setForm((f) => ({ ...f, registration_type: e.target.value }))}
            >
              <option value="ready">Ready</option>
              <option value="off_plan">Off-plan</option>
            </select>
            <Input type="number" placeholder="Transaction count" value={form.transaction_count} onChange={(e) => setForm((f) => ({ ...f, transaction_count: e.target.value }))} />
            <Input type="number" placeholder="Total value (AED)" value={form.total_value_aed} onChange={(e) => setForm((f) => ({ ...f, total_value_aed: e.target.value }))} />
            <Input type="number" placeholder="ROI %" value={form.roi_percent} onChange={(e) => setForm((f) => ({ ...f, roi_percent: e.target.value }))} />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total transaction value" value={formatAED(kpis.totalValue)} />
        <KpiCard label="Transactions" value={formatNumber(kpis.txCount)} />
        <KpiCard label="Avg transaction value" value={formatAED(kpis.avg)} />
        <KpiCard label="Avg ROI" value={formatPercent(kpis.avgRoi)} />
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Transaction value by area (AED)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="area" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v: any) => formatAEDCompact(Number(v))} tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v: any) => formatAED(Number(v))} />
                <Bar dataKey="value" fill="#0A1628" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Market data</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Area</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Txns</th>
                    <th className="py-2 pr-4">Total (AED)</th>
                    <th className="py-2 pr-4">Avg (AED)</th>
                    <th className="py-2 pr-4">ROI</th>
                    <th className="py-2 pr-4">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{r.area_name}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{r.registration_type === "off_plan" ? "Off-plan" : "Ready"}</Badge>
                      </td>
                      <td className="py-2 pr-4">{formatNumber(r.transaction_count)}</td>
                      <td className="py-2 pr-4">{formatAED(r.total_value_aed)}</td>
                      <td className="py-2 pr-4">{formatAED(r.avg_value_aed)}</td>
                      <td className="py-2 pr-4">{formatPercent(r.roi_percent)}</td>
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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[#0A1628]">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <Building2 className="mx-auto mb-3 h-8 w-8 opacity-50" />
      <p>No market data yet. Add a manual entry or connect Dubai Pulse in API Settings.</p>
    </div>
  )
}
