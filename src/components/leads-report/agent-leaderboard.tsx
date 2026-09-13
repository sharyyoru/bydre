"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, TrendingDown, Trophy, Medal, Award } from "lucide-react"

interface AgentLeaderboardProps {
  rows: Record<string, unknown>[]
  headers: string[]
}

interface AgentStats {
  name: string
  meetingsDone: number
  meetingsScheduled: number
  interested: number
  totalLeads: number
  conversionRate: number
}

export function AgentLeaderboard({ rows, headers }: AgentLeaderboardProps) {
  const agents = useMemo(() => {
    // Find the name column
    const nameColumn = headers.find(h => 
      h.toLowerCase().includes("vendor") || 
      h.toLowerCase().includes("agent") || 
      h.toLowerCase().includes("owner") ||
      h.toLowerCase().includes("name")
    )
    
    if (!nameColumn) return []

    // Find lead count column
    const leadCountColumn = headers.find(h => 
      h.toLowerCase().includes("lead ref") || 
      h.toLowerCase().includes("count") ||
      h.toLowerCase().includes("total")
    )

    const agentStats: AgentStats[] = rows
      .filter(row => row[nameColumn])
      .map(row => {
        const meetingsDone = Number(row["Meeting Done"]) || 0
        const meetingsScheduled = Number(row["Meeting Scheduled"]) || 0
        const interested = Number(row["Interested"]) || 0
        const totalLeads = leadCountColumn ? Number(row[leadCountColumn]) || 0 : meetingsDone + meetingsScheduled + interested
        
        return {
          name: String(row[nameColumn]),
          meetingsDone,
          meetingsScheduled,
          interested,
          totalLeads,
          conversionRate: totalLeads > 0 ? (meetingsDone / totalLeads) * 100 : 0
        }
      })
      .filter(a => a.totalLeads > 0)
      .sort((a, b) => {
        // Sort by meetings done + scheduled
        const aScore = a.meetingsDone * 2 + a.meetingsScheduled
        const bScore = b.meetingsDone * 2 + b.meetingsScheduled
        return bScore - aScore
      })
      .slice(0, 10)

    return agentStats
  }, [rows, headers])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-orange-400" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{index + 1}</span>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const avgConversion = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.conversionRate, 0) / agents.length
    : 0

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No agent data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Agent Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers by meetings completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agents.map((agent, index) => {
            const isAboveAvg = agent.conversionRate > avgConversion

            return (
              <div 
                key={agent.name}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  index === 0 ? "bg-yellow-50 border border-yellow-200" :
                  index === 1 ? "bg-gray-50 border border-gray-200" :
                  index === 2 ? "bg-orange-50 border border-orange-200" :
                  "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-sm font-medium ${
                      index === 0 ? "bg-yellow-200 text-yellow-800" :
                      index === 1 ? "bg-gray-200 text-gray-800" :
                      index === 2 ? "bg-orange-200 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {getInitials(agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{agent.totalLeads} leads</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {isAboveAvg ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        {agent.conversionRate.toFixed(1)}% conversion
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {agent.meetingsDone} done
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    {agent.meetingsScheduled} set
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {agents.reduce((sum, a) => sum + a.meetingsDone, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Meetings</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {avgConversion.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Avg Conversion</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {agents.length}
            </p>
            <p className="text-xs text-gray-500">Agents</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
