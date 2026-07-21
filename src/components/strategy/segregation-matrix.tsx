"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Check, X, AlertTriangle } from "lucide-react"
import { SEGREGATION_MATRIX, DONTS } from "./data"

function Cell({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400">
      <X className="h-3.5 w-3.5" />
    </span>
  )
}

export function SegregationMatrix() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/60">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 text-left font-medium">Content type</th>
                  <th className="py-2 px-3 text-center font-medium">Main</th>
                  <th className="py-2 px-3 text-center font-medium">Global</th>
                  <th className="py-2 px-3 text-center font-medium">Careers</th>
                  <th className="py-2 pl-4 text-left font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {SEGREGATION_MATRIX.map((row) => (
                  <tr key={row.type} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-[#0A1628]">{row.type}</td>
                    <td className="py-2.5 px-3 text-center"><Cell allowed={row.main} /></td>
                    <td className="py-2.5 px-3 text-center"><Cell allowed={row.global} /></td>
                    <td className="py-2.5 px-3 text-center"><Cell allowed={row.careers} /></td>
                    <td className="py-2.5 pl-4 text-xs text-muted-foreground">{row.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Don&apos;ts — keep the lanes clean
          </div>
          <ul className="mt-3 space-y-1.5">
            {DONTS.map((d) => (
              <li key={d} className="text-sm text-amber-900">• {d}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
