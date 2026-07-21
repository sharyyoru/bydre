"use client"

import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PLAYBOOKS, WEEKS_PER_MONTH, totalsFor } from "./data"

type Period = "week" | "month"

export function DeliverablesDashboard() {
  const [period, setPeriod] = useState<Period>("week")
  const mult = period === "month" ? WEEKS_PER_MONTH : 1

  const chartData = useMemo(
    () =>
      PLAYBOOKS.map((p) => ({
        page: p.name.split(" — ")[0],
        Feed: Math.round(p.deliverables.feed * mult),
        Stories: Math.round(p.deliverables.stories * mult),
        Reels: Math.round(p.deliverables.reels * mult),
        Shorts: Math.round(p.deliverables.shorts * mult),
      })),
    [mult]
  )

  const totals = totalsFor(period)
  const grandTotal = totals.feed + totals.stories + totals.reels + totals.shorts

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total output: <span className="font-bold text-[#0A1628]">{grandTotal}</span> assets / {period}
        </p>
        <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                period === p ? "bg-white text-[#0A1628] shadow-sm" : "text-muted-foreground"
              }`}
            >
              {p === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="page" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Feed" fill="#0A1628" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Stories" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Reels" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Shorts" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Page</th>
                  <th className="py-2 pr-4">Feed</th>
                  <th className="py-2 pr-4">Stories</th>
                  <th className="py-2 pr-4">Reels</th>
                  <th className="py-2 pr-4">Shorts</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {PLAYBOOKS.map((p) => {
                  const f = Math.round(p.deliverables.feed * mult)
                  const s = Math.round(p.deliverables.stories * mult)
                  const r = Math.round(p.deliverables.reels * mult)
                  const sh = Math.round(p.deliverables.shorts * mult)
                  return (
                    <tr key={p.key} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-[#0A1628]">{p.name}</td>
                      <td className="py-2 pr-4">{f}</td>
                      <td className="py-2 pr-4">{s}</td>
                      <td className="py-2 pr-4">{r}</td>
                      <td className="py-2 pr-4">{sh}</td>
                      <td className="py-2 pr-4 font-bold">{f + s + r + sh}</td>
                    </tr>
                  )
                })}
                <tr className="font-bold text-[#0A1628]">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4">{totals.feed}</td>
                  <td className="py-2 pr-4">{totals.stories}</td>
                  <td className="py-2 pr-4">{totals.reels}</td>
                  <td className="py-2 pr-4">{totals.shorts}</td>
                  <td className="py-2 pr-4">{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground" disabled>
            Numbers are targets — editable in data.ts
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
