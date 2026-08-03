"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  RefreshCw,
  Building2,
  MapPin,
  Table2,
  Map,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
} from "lucide-react"
import { formatAED, formatNumber } from "@/lib/social-monitor/format"
import { resolveWorkspaceId } from "@/lib/workspace-client"
import { ProjectMap } from "./project-map"

interface GenieMapProject {
  id: string
  workspace_id: string
  external_id: number
  name: string
  developer_name: string | null
  district_name: string | null
  status: "available" | "sold_out" | "launch" | null
  price_min: number | null
  price_max: number | null
  price_per_sqft: number | null
  area_min: number | null
  area_max: number | null
  handover_date: string | null
  service_charge: number | null
  eoi_amount: number | null
  unit_types: Array<{
    type: string
    beds: number
    area: number
    price: number
  }>
  latitude: number | null
  longitude: number | null
  image_url: string | null
  ingested_at: string
}

type ViewMode = "table" | "map"

export function OffplanProjects({ workspaceId: workspaceIdentifier }: { workspaceId: string }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [projects, setProjects] = useState<GenieMapProject[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [developerFilter, setDeveloperFilter] = useState<string>("all")
  const [districtFilter, setDistrictFilter] = useState<string>("all")

  // Resolve workspace slug to UUID
  useEffect(() => {
    const supabase = createClient()
    resolveWorkspaceId(supabase, workspaceIdentifier).then((id) => {
      if (id) setWorkspaceId(id)
      else setLoading(false)
    })
  }, [workspaceIdentifier])

  const load = async () => {
    if (!workspaceId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("geniemap_projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true })
    setProjects((data || []) as GenieMapProject[])
    setLoading(false)
  }

  useEffect(() => {
    if (!workspaceId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  // Extract unique values for filter dropdowns
  const developers = useMemo(() => {
    const set = new Set(projects.map((p) => p.developer_name).filter(Boolean))
    return Array.from(set).sort() as string[]
  }, [projects])

  const districts = useMemo(() => {
    const set = new Set(projects.map((p) => p.district_name).filter(Boolean))
    return Array.from(set).sort() as string[]
  }, [projects])

  // Apply filters
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false
      }
      if (developerFilter !== "all" && p.developer_name !== developerFilter) {
        return false
      }
      if (districtFilter !== "all" && p.district_name !== districtFilter) {
        return false
      }
      return true
    })
  }, [projects, search, statusFilter, developerFilter, districtFilter])

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length
    const avgPricePerSqft =
      filtered.filter((p) => p.price_per_sqft).length > 0
        ? filtered
            .filter((p) => p.price_per_sqft)
            .reduce((s, p) => s + (p.price_per_sqft || 0), 0) /
          filtered.filter((p) => p.price_per_sqft).length
        : 0

    const now = new Date()
    const sixMonths = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000)
    const upcomingHandovers = filtered.filter((p) => {
      if (!p.handover_date) return false
      const d = new Date(p.handover_date)
      return d >= now && d <= sixMonths
    }).length

    const avgServiceCharge =
      filtered.filter((p) => p.service_charge).length > 0
        ? filtered
            .filter((p) => p.service_charge)
            .reduce((s, p) => s + (p.service_charge || 0), 0) /
          filtered.filter((p) => p.service_charge).length
        : 0

    return { total, avgPricePerSqft, upcomingHandovers, avgServiceCharge }
  }, [filtered])

  const refresh = async () => {
    setRefreshing(true)
    const res = await fetch("/api/social-monitor/ingest/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId }),
    })
    setRefreshing(false)
    if (res.status === 501) {
      toast.error("GenieMap not configured — add your key in API Settings")
      return
    }
    if (res.ok) {
      const json = await res.json()
      toast.success(`Ingested ${json.inserted} projects`)
      load()
    } else {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error || "Ingestion failed")
    }
  }

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return "—"
    if (min && max && min !== max) return `${formatAED(min)} - ${formatAED(max)}`
    return formatAED(min || max || 0)
  }

  const formatHandover = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    })
  }

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Available</Badge>
      case "sold_out":
        return <Badge className="bg-red-100 text-red-700 border-0">Sold Out</Badge>
      case "launch":
        return <Badge className="bg-blue-100 text-blue-700 border-0">Launching</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="launch">Launching</option>
            <option value="sold_out">Sold Out</option>
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm max-w-[180px]"
            value={developerFilter}
            onChange={(e) => setDeveloperFilter(e.target.value)}
          >
            <option value="all">All Developers</option>
            {developers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm max-w-[180px]"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              size="sm"
              variant={viewMode === "table" ? "default" : "ghost"}
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "map" ? "default" : "ghost"}
              className="rounded-l-none"
              onClick={() => setViewMode("map")}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Total Projects"
          value={formatNumber(kpis.total)}
        />
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Avg Price/sqft"
          value={kpis.avgPricePerSqft ? `AED ${formatNumber(Math.round(kpis.avgPricePerSqft))}` : "—"}
        />
        <KpiCard
          icon={<Calendar className="h-4 w-4" />}
          label="Handovers (6 mo)"
          value={formatNumber(kpis.upcomingHandovers)}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Service Charge"
          value={kpis.avgServiceCharge ? `AED ${formatNumber(Math.round(kpis.avgServiceCharge))}/sqft` : "—"}
        />
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Off-plan Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Project</th>
                      <th className="py-2 pr-4">Developer</th>
                      <th className="py-2 pr-4">District</th>
                      <th className="py-2 pr-4">Price Range</th>
                      <th className="py-2 pr-4">Price/sqft</th>
                      <th className="py-2 pr-4">Handover</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{p.name}</div>
                          {p.unit_types?.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {p.unit_types
                                .map((u) => `${u.beds}BR`)
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">{p.developer_name || "—"}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {p.district_name || "—"}
                          </div>
                        </td>
                        <td className="py-3 pr-4">{formatPrice(p.price_min, p.price_max)}</td>
                        <td className="py-3 pr-4">
                          {p.price_per_sqft ? `AED ${formatNumber(Math.round(p.price_per_sqft))}` : "—"}
                        </td>
                        <td className="py-3 pr-4">{formatHandover(p.handover_date)}</td>
                        <td className="py-3 pr-4">{statusBadge(p.status)}</td>
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
      ) : (
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Project Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length ? (
              <ProjectMap projects={filtered} workspaceId={workspaceId!} />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
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

function EmptyState() {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <Building2 className="mx-auto mb-3 h-8 w-8 opacity-50" />
      <p>No projects yet. Click Refresh to fetch from GenieMap, or add your API key in Settings.</p>
    </div>
  )
}
