"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Compass } from "lucide-react"
import { OverviewSection } from "./overview-section"
import { PagePlaybooks } from "./page-playbooks"
import { DeliverablesDashboard } from "./deliverables-dashboard"
import { SegregationMatrix } from "./segregation-matrix"
import { ChannelsFlow } from "./channels-flow"
import { Roadmap } from "./roadmap"
import { KpisSection } from "./kpis-section"

const SECTIONS = [
  { value: "overview", label: "Overview", node: <OverviewSection /> },
  { value: "pages", label: "The 3 Pages", node: <PagePlaybooks /> },
  { value: "deliverables", label: "Deliverables", node: <DeliverablesDashboard /> },
  { value: "segregation", label: "Segregation", node: <SegregationMatrix /> },
  { value: "channels", label: "Channels & Flow", node: <ChannelsFlow /> },
  { value: "roadmap", label: "Roadmap", node: <Roadmap /> },
  { value: "kpis", label: "KPIs", node: <KpisSection /> },
]

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview & North Star", subtitle: "Why we're doing this and how the pages fit together" },
  pages: { title: "The Three Pages", subtitle: "Distinct roles, audiences, pillars, and deliverables" },
  deliverables: { title: "Deliverables Dashboard", subtitle: "Concrete output targets per page and format" },
  segregation: { title: "Content Segregation", subtitle: "What belongs where — and what to avoid" },
  channels: { title: "Channels & Repurposing", subtitle: "How one shoot feeds every format" },
  roadmap: { title: "Phase Roadmap", subtitle: "Where we start and where we're heading" },
  kpis: { title: "KPIs & Success Metrics", subtitle: "How we measure each page" },
}

export function Strategy({ workspaceId }: { workspaceId: string }) {
  // workspaceId reserved for future DB-backed edition of this page.
  void workspaceId
  const [section, setSection] = useState("overview")
  const meta = SECTION_TITLES[section]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Compass className="h-6 w-6 text-[#0A1628]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Social Media Strategy</h1>
          <p className="text-sm text-muted-foreground">
            DreHomes Phase 1 — brand, global reach, and talent across Instagram + YouTube Shorts
          </p>
        </div>
      </div>

      <Tabs value={section} onValueChange={setSection}>
        <div className="sticky top-16 z-10 -mx-4 bg-dre-surface/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <TabsList>
            {SECTIONS.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-2">
          <h2 className="text-lg font-bold text-[#0A1628]">{meta.title}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{meta.subtitle}</p>
        </div>

        {SECTIONS.map((s) => (
          <TabsContent key={s.value} value={s.value} className="mt-0 animate-in fade-in-50 duration-300">
            {s.node}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
