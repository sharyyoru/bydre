"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface FunnelStage {
  name: string
  value: number
  color: string
}

interface LeadFunnelChartProps {
  data: Record<string, number>
}

const FUNNEL_STAGES = [
  { key: "Fresh Lead", label: "Fresh Leads", color: "#6366f1" },
  { key: "Information Shared", label: "Info Shared", color: "#8b5cf6" },
  { key: "Interested", label: "Interested", color: "#a855f7" },
  { key: "Meeting Scheduled", label: "Meetings Set", color: "#3b82f6" },
  { key: "Meeting Done", label: "Meetings Done", color: "#10b981" },
]

export function LeadFunnelChart({ data }: LeadFunnelChartProps) {
  const stages: FunnelStage[] = useMemo(() => {
    return FUNNEL_STAGES.map(stage => ({
      name: stage.label,
      value: data[stage.key] || 0,
      color: stage.color
    })).filter(s => s.value > 0)
  }, [data])

  const maxValue = Math.max(...stages.map(s => s.value), 1)
  const totalLeads = data["Lead Ref No. Count"] || data["Lead Ref No.\nCount"] || stages[0]?.value || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Lead Conversion Funnel
        </CardTitle>
        <CardDescription>
          From initial lead to meeting completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercent = (stage.value / maxValue) * 100
            const conversionRate = index === 0 
              ? 100 
              : stages[index - 1]?.value > 0 
                ? ((stage.value / stages[index - 1].value) * 100).toFixed(1)
                : 0

            return (
              <div key={stage.name} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{stage.value.toLocaleString()}</span>
                    {index > 0 && (
                      <span className="text-xs text-gray-500">
                        ({conversionRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-center"
                    style={{ 
                      width: `${widthPercent}%`,
                      backgroundColor: stage.color,
                      minWidth: widthPercent > 0 ? "40px" : "0"
                    }}
                  >
                    {widthPercent > 20 && (
                      <span className="text-white text-xs font-medium">
                        {((stage.value / totalLeads) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Conversion Summary */}
        {stages.length >= 2 && (
          <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {totalLeads > 0 
                  ? ((stages[stages.length - 1]?.value / totalLeads) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">Overall Conversion</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stages[stages.length - 1]?.value || 0}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {stages.length}
              </p>
              <p className="text-xs text-gray-500">Stages</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
