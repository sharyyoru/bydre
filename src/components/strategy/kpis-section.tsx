"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { KPIS } from "./data"

export function KpisSection() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {KPIS.map((group) => (
        <Card key={group.page} className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${group.accent}15`, color: group.accent }}
              >
                <TrendingUp className="h-4 w-4" />
              </span>
              <p className="font-bold text-[#0A1628]">{group.page}</p>
            </div>
            <ul className="mt-3 space-y-2">
              {group.kpis.map((kpi) => (
                <li key={kpi} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: group.accent }} />
                  {kpi}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
