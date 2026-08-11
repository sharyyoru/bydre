"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Brain,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Target,
  Zap,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react"
import { OpportunityCard } from "./opportunity-card"
import { MarketSignals } from "./market-signals"
import { CommissionEditor } from "./commission-editor"
import { SalesOpportunity, ProjectAlert, MarketSignal } from "@/lib/sales-brain/types"

interface SalesBrainProps {
  workspaceId: string
}

export function SalesBrain({ workspaceId }: SalesBrainProps) {
  const [tab, setTab] = useState("opportunities")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([])
  const [marketSummary, setMarketSummary] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<ProjectAlert[]>([])
  const [signals, setSignals] = useState<MarketSignal[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Fetch recommendations
      const recRes = await fetch(
        `/api/sales-brain/recommend?workspace_id=${workspaceId}&limit=5${refresh ? "&refresh=true" : ""}`
      )
      if (recRes.ok) {
        const recData = await recRes.json()
        setOpportunities(recData.opportunities || [])
        setMarketSummary(recData.market_summary)
        setGeneratedAt(recData.generated_at)
      }

      // Fetch alerts
      const alertRes = await fetch(`/api/sales-brain/alerts?workspace_id=${workspaceId}&unread_only=true`)
      if (alertRes.ok) {
        const alertData = await alertRes.json()
        setAlerts(alertData.alerts || [])
      }

      // Fetch recent signals
      const sigRes = await fetch(`/api/sales-brain/signals?workspace_id=${workspaceId}&limit=10`)
      if (sigRes.ok) {
        const sigData = await sigRes.json()
        setSignals(sigData.signals || [])
      }
    } catch (err) {
      console.error("Sales brain fetch error:", err)
      toast.error("Failed to load sales intelligence")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData(true)
    toast.success("Refreshing recommendations...")
  }

  const topOpportunity = opportunities[0]
  const otherOpportunities = opportunities.slice(1)
  const unreadAlerts = alerts.filter(a => !a.is_read)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-[#D4AF37] mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading Sales Intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-xl">
            <Brain className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Sales Brain</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered insights • What to sell today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {new Date(generatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          {unreadAlerts.length > 0 && (
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Market Summary */}
      {marketSummary && (
        <Card className="bg-gradient-to-br from-[#0A1628] to-[#1a2942] text-white border-0">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#D4AF37] mb-1">AI Market Insight</p>
                <p className="text-sm text-white/90 leading-relaxed">{marketSummary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Opportunities</span>
          </TabsTrigger>
          <TabsTrigger value="signals" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Signals</span>
          </TabsTrigger>
          <TabsTrigger value="velocity" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Velocity</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Commissions</span>
          </TabsTrigger>
        </TabsList>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6 mt-6">
          {opportunities.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No opportunities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import inventory data from GenieMap or add projects manually to get AI recommendations.
                </p>
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top Opportunity - Featured */}
              {topOpportunity && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#D4AF37] text-black">🎯 Top Pick</Badge>
                    <span className="text-sm text-muted-foreground">
                      Highest overall score
                    </span>
                  </div>
                  <OpportunityCard opportunity={topOpportunity} featured />
                </div>
              )}

              {/* Other Opportunities */}
              {otherOpportunities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Other Strong Opportunities
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {otherOpportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Avg Velocity</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {(opportunities.reduce((s, o) => s + (o.velocity_score || 0), 0) / opportunities.length).toFixed(0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                      <span className="text-sm text-muted-foreground">Best Commission</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {Math.max(...opportunities.map(o => o.effective_commission_pct || 0)).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Fastest Sellout</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {Math.min(...opportunities.filter(o => o.days_to_sellout).map(o => o.days_to_sellout!)) || "—"}
                      <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">Low Inventory</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {opportunities.filter(o => (o.inventory_remaining_pct || 100) < 30).length}
                      <span className="text-sm font-normal text-muted-foreground ml-1">projects</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals" className="mt-6">
          <MarketSignals workspaceId={workspaceId} signals={signals} />
        </TabsContent>

        {/* Velocity Tab */}
        <TabsContent value="velocity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Inventory Velocity Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Track how fast projects are selling. Higher velocity = hotter project.
              </p>
              {opportunities.length > 0 ? (
                <div className="space-y-3">
                  {opportunities
                    .sort((a, b) => (b.velocity_score || 0) - (a.velocity_score || 0))
                    .map((opp) => (
                      <div
                        key={opp.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{opp.project_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {opp.developer_name || "Unknown Developer"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#D4AF37] to-green-500"
                                style={{ width: `${opp.velocity_score || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">
                              {opp.velocity_score || 0}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {opp.daily_sales_rate?.toFixed(1) || "—"} units/day •{" "}
                            {opp.inventory_remaining_pct?.toFixed(0) || "—"}% left
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No velocity data available. Import inventory snapshots to track sales velocity.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="mt-6">
          <CommissionEditor workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
