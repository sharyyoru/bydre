"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Radar, Database, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { MarketPulse } from "./market-pulse"
import { SentimentTracker } from "./sentiment-tracker"
import { ArbitrageEngine } from "./arbitrage-engine"
import { ContentPipeline } from "./content-pipeline"
import { OffplanProjects } from "./offplan-projects"
import { GlobalDemand } from "./global-demand"
import { CryptoSentiment } from "./crypto-sentiment"
import { SalesBrain } from "../sales-brain/sales-brain"

const TABS = [
  { value: "brain", label: "🧠 Sales Brain" },
  { value: "market", label: "Market Pulse" },
  { value: "offplan", label: "Off-plan Projects" },
  { value: "global", label: "Global Demand" },
  { value: "crypto", label: "Crypto Interest" },
  { value: "sentiment", label: "Sentiment Tracker" },
  { value: "arbitrage", label: "Arbitrage Engine" },
  { value: "pipeline", label: "Content Pipeline" },
]

export function SocialMonitor({ workspaceId: workspaceIdentifier }: { workspaceId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState(() => searchParams.get("tab") || "brain")
  const [seeding, setSeeding] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Resolve workspace slug to UUID
  useEffect(() => {
    const resolveWorkspace = async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceIdentifier)
      
      if (isUUID) {
        setWorkspaceId(workspaceIdentifier)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceIdentifier)
        .maybeSingle()
      
      if (data) {
        setWorkspaceId(data.id)
      } else {
        // Fallback to first workspace
        const { data: anyWs } = await supabase
          .from("workspaces")
          .select("id")
          .limit(1)
          .maybeSingle()
        if (anyWs) setWorkspaceId(anyWs.id)
      }
      setLoading(false)
    }
    
    resolveWorkspace()
  }, [workspaceIdentifier])

  const onTabChange = (value: string) => {
    setTab(value)
    const next = new URLSearchParams(window.location.search)
    next.set("tab", value)
    router.replace(`${pathname}?${next}`)
  }

  const loadDemoData = async () => {
    setSeeding(true)
    try {
      const res = await fetch("/api/social-monitor/seed-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      if (res.ok) {
        const json = await res.json()
        toast.success(json.message)
        // Refresh the page to reload data
        window.location.reload()
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || "Failed to load demo data")
      }
    } catch {
      toast.error("Failed to load demo data")
    } finally {
      setSeeding(false)
    }
  }

  // Show loading state while resolving workspace
  if (loading || !workspaceId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Radar className="h-6 w-6 text-[#0A1628]" />
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Social Monitor</h1>
            <p className="text-sm text-muted-foreground">Loading workspace...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-6 w-6 text-[#0A1628]" />
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Social Monitor</h1>
            <p className="text-sm text-muted-foreground">
              Predictive real-estate analytics, sentiment, and AI content syndication
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadDemoData} disabled={seeding}>
          {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
          {seeding ? "Loading..." : "Load Demo Data"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="brain">
          <SalesBrain workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="market">
          <MarketPulse workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="offplan">
          <OffplanProjects workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="global">
          <GlobalDemand workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="crypto">
          <CryptoSentiment workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="sentiment">
          <SentimentTracker workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="arbitrage">
          <ArbitrageEngine workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="pipeline">
          <ContentPipeline workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
