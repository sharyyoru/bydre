"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ChevronDown,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatAED, formatNumber } from "@/lib/social-monitor/format"
import { resolveWorkspaceId } from "@/lib/workspace-client"
import { ProjectMap } from "./project-map"

const PAGE_SIZE = 20

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
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [developerFilter, setDeveloperFilter] = useState<string>("all")
  const [districtFilter, setDistrictFilter] = useState<string>("all")
  
  // Searchable dropdown state
  const [developerSearch, setDeveloperSearch] = useState("")
  const [districtSearch, setDistrictSearch] = useState("")
  const [developerOpen, setDeveloperOpen] = useState(false)
  const [districtOpen, setDistrictOpen] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)

  // Check if any filters are active
  const hasActiveFilters = search || statusFilter !== "all" || developerFilter !== "all" || districtFilter !== "all"

  // Clear all filters
  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setDeveloperFilter("all")
    setDistrictFilter("all")
    setPage(1)
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

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
    
    // Fetch all projects using pagination (Supabase default limit is 1000)
    let allData: GenieMapProject[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from("geniemap_projects")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name", { ascending: true })
        .range(from, from + pageSize - 1)

      if (error) {
        console.error("Error loading projects:", error)
        break
      }

      if (data && data.length > 0) {
        allData = allData.concat(data as GenieMapProject[])
        from += pageSize
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }

    setProjects(allData)
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

  // Filtered developers for searchable dropdown
  const filteredDevelopers = useMemo(() => {
    if (!developerSearch) return developers
    return developers.filter(d => d.toLowerCase().includes(developerSearch.toLowerCase()))
  }, [developers, developerSearch])

  const districts = useMemo(() => {
    const set = new Set(projects.map((p) => p.district_name).filter(Boolean))
    return Array.from(set).sort() as string[]
  }, [projects])

  // Filtered districts for searchable dropdown
  const filteredDistricts = useMemo(() => {
    if (!districtSearch) return districts
    return districts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))
  }, [districts, districtSearch])

  // Smart search - searches across multiple fields
  const matchesSearch = useCallback((p: GenieMapProject, query: string) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.developer_name?.toLowerCase().includes(q) ?? false) ||
      (p.district_name?.toLowerCase().includes(q) ?? false) ||
      p.unit_types?.some(u => u.type.toLowerCase().includes(q)) ||
      (p.status?.toLowerCase().includes(q) ?? false)
    )
  }, [])

  // Apply filters
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (!matchesSearch(p, debouncedSearch)) return false
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (developerFilter !== "all" && p.developer_name !== developerFilter) return false
      if (districtFilter !== "all" && p.district_name !== districtFilter) return false
      return true
    })
  }, [projects, debouncedSearch, statusFilter, developerFilter, districtFilter, matchesSearch])

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, developerFilter, districtFilter])

  // Helper to get price per sqft (from field or calculate from price/area)
  const getPricePerSqft = (p: GenieMapProject): number | null => {
    if (p.price_per_sqft && p.price_per_sqft > 0) return p.price_per_sqft
    // Calculate from price_min and area_min if available
    if (p.price_min && p.area_min && p.area_min > 0) {
      return p.price_min / p.area_min
    }
    // Try from unit_types
    if (p.unit_types && p.unit_types.length > 0) {
      const validUnits = p.unit_types.filter(u => u.price > 0 && u.area > 0)
      if (validUnits.length > 0) {
        const avg = validUnits.reduce((sum, u) => sum + (u.price / u.area), 0) / validUnits.length
        return avg
      }
    }
    return null
  }

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length
    
    // Calculate avg price per sqft dynamically
    const pricesPerSqft = filtered.map(getPricePerSqft).filter((v): v is number => v !== null && v > 0)
    const avgPricePerSqft = pricesPerSqft.length > 0
      ? pricesPerSqft.reduce((s, v) => s + v, 0) / pricesPerSqft.length
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
          {/* Searchable Developer Dropdown */}
          <Popover open={developerOpen} onOpenChange={setDeveloperOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 w-[180px] justify-between text-sm font-normal">
                <span className="truncate">
                  {developerFilter === "all" ? "All Developers" : developerFilter}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search developers..."
                value={developerSearch}
                onChange={(e) => setDeveloperSearch(e.target.value)}
                className="mb-2 h-8"
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted"
                  onClick={() => { setDeveloperFilter("all"); setDeveloperOpen(false); setDeveloperSearch(""); }}
                >
                  All Developers
                </button>
                {filteredDevelopers.map((d) => (
                  <button
                    key={d}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate ${developerFilter === d ? "bg-muted font-medium" : ""}`}
                    onClick={() => { setDeveloperFilter(d); setDeveloperOpen(false); setDeveloperSearch(""); }}
                  >
                    {d}
                  </button>
                ))}
                {filteredDevelopers.length === 0 && (
                  <p className="text-sm text-muted-foreground px-2 py-1.5">No developers found</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Searchable District Dropdown */}
          <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 w-[180px] justify-between text-sm font-normal">
                <span className="truncate">
                  {districtFilter === "all" ? "All Districts" : districtFilter}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search districts..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="mb-2 h-8"
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted"
                  onClick={() => { setDistrictFilter("all"); setDistrictOpen(false); setDistrictSearch(""); }}
                >
                  All Districts
                </button>
                {filteredDistricts.map((d) => (
                  <button
                    key={d}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate ${districtFilter === d ? "bg-muted font-medium" : ""}`}
                    onClick={() => { setDistrictFilter(d); setDistrictOpen(false); setDistrictSearch(""); }}
                  >
                    {d}
                  </button>
                ))}
                {filteredDistricts.length === 0 && (
                  <p className="text-sm text-muted-foreground px-2 py-1.5">No districts found</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-2 text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
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
                    {paginatedProjects.map((p) => (
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
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} projects
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
