"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, CircleDashed } from "lucide-react"
import { ROADMAP, Phase } from "./data"

const STATUS_META: Record<Phase["status"], { label: string; icon: React.ElementType; className: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-0" },
  next: { label: "Next", icon: Circle, className: "bg-blue-100 text-blue-700 border-0" },
  future: { label: "Future", icon: CircleDashed, className: "bg-muted text-muted-foreground border-0" },
}

export function Roadmap() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ROADMAP.map((phase) => {
        const meta = STATUS_META[phase.status]
        const Icon = meta.icon
        return (
          <Card
            key={phase.name}
            className={`rounded-2xl transition-shadow hover:shadow-md ${
              phase.status === "active" ? "border-emerald-300 ring-1 ring-emerald-200" : "border-border/60"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Icon
                  className={`h-5 w-5 ${
                    phase.status === "active"
                      ? "text-emerald-600"
                      : phase.status === "next"
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }`}
                />
                <Badge className={meta.className}>{meta.label}</Badge>
              </div>
              <p className="mt-3 text-base font-bold text-[#0A1628]">{phase.name}</p>
              <p className="text-xs text-muted-foreground">{phase.timeframe}</p>
              <ul className="mt-3 space-y-1.5">
                {phase.points.map((pt) => (
                  <li key={pt} className="text-sm text-muted-foreground">• {pt}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
