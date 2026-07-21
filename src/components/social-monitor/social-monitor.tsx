"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Radar } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MarketPulse } from "./market-pulse"
import { SentimentTracker } from "./sentiment-tracker"
import { ArbitrageEngine } from "./arbitrage-engine"
import { ContentPipeline } from "./content-pipeline"

const TABS = [
  { value: "market", label: "Market Pulse" },
  { value: "sentiment", label: "Sentiment Tracker" },
  { value: "arbitrage", label: "Arbitrage Engine" },
  { value: "pipeline", label: "Content Pipeline" },
]

export function SocialMonitor({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState(() => searchParams.get("tab") || "market")

  const onTabChange = (value: string) => {
    setTab(value)
    const next = new URLSearchParams(window.location.search)
    next.set("tab", value)
    router.replace(`${pathname}?${next}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radar className="h-6 w-6 text-[#0A1628]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Social Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Predictive real-estate analytics, sentiment, and AI content syndication
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="market">
          <MarketPulse workspaceId={workspaceId} />
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
