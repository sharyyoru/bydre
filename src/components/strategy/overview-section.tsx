"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Globe2, Users, Sparkles, FileText, Camera, Clapperboard, Youtube } from "lucide-react"
import { PLAYBOOKS, totalsFor } from "./data"
import { useCountUp } from "./use-count-up"

const PAGE_ICONS = { main: Sparkles, global: Globe2, careers: Users } as const

function Stat({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  const [display, ref] = useCountUp(value)
  return (
    <div ref={ref} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center">
      <Icon className="mb-2 h-5 w-5 text-[#D4AF37]" />
      <span className="text-3xl font-bold text-white">{display}</span>
      <span className="mt-1 text-xs uppercase tracking-wider text-white/50">{label}</span>
    </div>
  )
}

export function OverviewSection() {
  const totals = totalsFor("week")
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl bg-[#0A1628] p-8 text-white">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Target className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">North Star</span>
        </div>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight">
          Grow the agent force, win global markets, and make DreHomes the flagship real-estate brand.
        </h2>
        <p className="mt-3 max-w-2xl text-white/70">
          Three Instagram pages, three distinct jobs — reinforced by a YouTube Shorts repurposing engine.
          Clear roles, clear content lanes, and a defined weekly output so nothing overlaps and nothing slips.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={totals.feed} label="Feed / week" icon={FileText} />
          <Stat value={totals.stories} label="Stories / week" icon={Camera} />
          <Stat value={totals.reels} label="Reels / week" icon={Clapperboard} />
          <Stat value={totals.shorts} label="Shorts / week" icon={Youtube} />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-bold text-[#0A1628]">The core problem we&apos;re solving</h3>
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
          We need more agents (local & global) and stronger talent attraction, a brand page that actually
          reads as the brand, and true global reach through localized content. Each page below owns one of
          these outcomes.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAYBOOKS.map((p) => {
            const Icon = PAGE_ICONS[p.key]
            return (
              <Card key={p.key} className="rounded-2xl border-border/60 transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <div
                    className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${p.accent}15`, color: p.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{p.handle}</p>
                  <p className="mt-0.5 text-base font-bold text-[#0A1628]">{p.name}</p>
                  <Badge variant="outline" className="mt-2" style={{ borderColor: `${p.accent}40`, color: p.accent }}>
                    {p.role}
                  </Badge>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-4">{p.objective}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
