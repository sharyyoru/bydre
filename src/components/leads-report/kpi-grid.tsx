"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Phone,
  Filter,
  Target
} from "lucide-react"

interface KPIGridProps {
  totals: Record<string, number>
}

interface KPICard {
  label: string
  value: number | string
  icon: React.ReactNode
  badge?: { text: string; color: string }
  description?: string
  trend?: number
}

export function KPIGrid({ totals }: KPIGridProps) {
  const totalLeads = totals["Lead Ref No. Count"] || totals["Lead Ref No.\nCount"] || 0
  const meetingsDone = totals["Meeting Done"] || 0
  const meetingsScheduled = totals["Meeting Scheduled"] || 0
  const interested = totals["Interested"] || 0
  const notQualified = totals["Not Qualified"] || 0
  const noAnswer = totals["No Answer/Busy"] || 0
  const invalid = totals["Invalid/Wrong Number"] || 0
  const freshLeads = totals["Fresh Lead"] || 0
  const callBack = totals["Call Back"] || 0

  const conversionRate = totalLeads > 0 ? ((meetingsDone / totalLeads) * 100).toFixed(1) : "0"
  const qualificationRate = totalLeads > 0 ? (((totalLeads - notQualified) / totalLeads) * 100).toFixed(1) : "0"
  const contactRate = totalLeads > 0 ? (((totalLeads - noAnswer - invalid) / totalLeads) * 100).toFixed(1) : "0"
  const hotLeadRate = totalLeads > 0 ? (((meetingsDone + meetingsScheduled + interested) / totalLeads) * 100).toFixed(1) : "0"

  const kpis: KPICard[] = [
    {
      label: "Total Leads",
      value: totalLeads.toLocaleString(),
      icon: <Users className="h-5 w-5 text-blue-600" />,
      badge: { text: "Total", color: "bg-blue-100 text-blue-800" }
    },
    {
      label: "Done",
      value: meetingsDone.toLocaleString(),
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      badge: { text: "Won", color: "bg-green-100 text-green-800" }
    },
    {
      label: "Scheduled",
      value: meetingsScheduled.toLocaleString(),
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      badge: { text: "Pipeline", color: "bg-blue-100 text-blue-800" }
    },
    {
      label: "Interested",
      value: interested.toLocaleString(),
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
      badge: { text: "Hot", color: "bg-purple-100 text-purple-800" }
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      description: "Leads → Mtg"
    },
    {
      label: "Contact",
      value: `${contactRate}%`,
      icon: <Phone className="h-5 w-5 text-cyan-600" />,
      description: "Reached"
    },
    {
      label: "Qualified",
      value: `${qualificationRate}%`,
      icon: <Filter className="h-5 w-5 text-orange-600" />,
      description: "Criteria"
    },
    {
      label: "Hot Leads",
      value: `${hotLeadRate}%`,
      icon: <Target className="h-5 w-5 text-red-600" />,
      description: "Pipeline"
    }
  ]

  const secondaryKpis = [
    { label: "Fresh Leads", value: freshLeads, color: "text-indigo-600" },
    { label: "Callbacks", value: callBack, color: "text-yellow-600" },
    { label: "Not Qualified", value: notQualified, color: "text-red-600" },
    { label: "Invalid Numbers", value: invalid, color: "text-gray-600" }
  ]

  return (
    <div className="space-y-4">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <CardContent className="pt-3 pb-2 px-3">
              <div className="flex items-center justify-between mb-1 gap-1">
                <span className="flex-shrink-0">{kpi.icon}</span>
                {kpi.badge && (
                  <Badge className={`${kpi.badge.color} text-[10px] px-1.5 py-0`} variant="outline">
                    {kpi.badge.text}
                  </Badge>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">{kpi.value}</p>
              <p className="text-[11px] text-gray-500 truncate">{kpi.label}</p>
              {kpi.description && (
                <p className="text-[9px] text-gray-400 truncate">{kpi.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {secondaryKpis.map((kpi) => (
          <div 
            key={kpi.label} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-w-0 gap-2"
          >
            <span className="text-xs text-gray-600 truncate">{kpi.label}</span>
            <span className={`font-bold flex-shrink-0 ${kpi.color}`}>
              {kpi.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
