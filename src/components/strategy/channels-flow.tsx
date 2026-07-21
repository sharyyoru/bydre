"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Camera, Clapperboard, CircleDot, Youtube } from "lucide-react"
import { REPURPOSING_FLOW } from "./data"

const STEP_ICONS = [Camera, Clapperboard, CircleDot, Youtube]

export function ChannelsFlow() {
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        One shoot feeds every format. Vertical-first content flows from Reels and Stories straight into
        YouTube Shorts — maximizing output per asset without extra production days.
      </p>

      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {REPURPOSING_FLOW.map((step, i) => {
          const Icon = STEP_ICONS[i] || CircleDot
          return (
            <div key={step.label} className="flex flex-1 items-center gap-3">
              <Card className="flex-1 rounded-2xl border-border/60 transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A1628]/5 text-[#0A1628]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-[#0A1628]">{step.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                </CardContent>
              </Card>
              {i < REPURPOSING_FLOW.length - 1 && (
                <ArrowRight className="hidden h-5 w-5 shrink-0 text-[#D4AF37] lg:block" />
              )}
            </div>
          )
        })}
      </div>

      <Card className="rounded-2xl border-border/60 bg-[#0A1628] text-white">
        <CardContent className="pt-6">
          <p className="text-sm text-white/80">
            <span className="font-semibold text-[#D4AF37]">Phase 1 channels:</span> Instagram (Feed, Stories,
            Reels) across all three pages + YouTube Shorts as the repurposing outlet. Long-form YouTube and
            additional platforms arrive in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
