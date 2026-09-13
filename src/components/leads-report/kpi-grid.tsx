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
      label: "Meetings Done",
      value: meetingsDone.toLocaleString(),
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      badge: { text: "Won", color: "bg-green-100 text-green-800" }
    },
    {
      label: "Meetings Scheduled",
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
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      description: "Leads → Meetings"
    },
    {
      label: "Contact Rate",
      value: `${contactRate}%`,
      icon: <Phone className="h-5 w-5 text-cyan-600" />,
      description: "Successfully reached"
    },
    {
      label: "Qualification Rate",
      value: `${qualificationRate}%`,
      icon: <Filter className="h-5 w-5 text-orange-600" />,
      description: "Meet criteria"
    },
    {
      label: "Hot Lead Rate",
      value: `${hotLeadRate}%`,
      icon: <Target className="h-5 w-5 text-red-600" />,
      description: "In active pipeline"
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                {kpi.icon}
                {kpi.badge && (
                  <Badge className={kpi.badge.color} variant="outline">
                    {kpi.badge.text}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
              {kpi.description && (
                <p className="text-[10px] text-gray-400 mt-1">{kpi.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {secondaryKpis.map((kpi) => (
          <div 
            key={kpi.label} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-sm text-gray-600">{kpi.label}</span>
            <span className={`font-bold ${kpi.color}`}>
              {kpi.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
