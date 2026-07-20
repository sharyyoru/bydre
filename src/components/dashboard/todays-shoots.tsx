"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Camera, Clock } from "lucide-react"

type ShootItem = {
  id: string
  title: string
  shoot_time: string | null
  location: string | null
  crew: string | null
  owner_name: string | null
  owner_email: string | null
  board_id: string
}

export function TodaysShootsReport({ workspaceSlug }: { workspaceSlug: string }) {
  const [shoots, setShoots] = useState<ShootItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodaysShoots = async () => {
      const supabase = createClient()
      
      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const todayStr = today.toISOString().split('T')[0]
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      // Get Shoots board
      const { data: board } = await supabase
        .from("boards")
        .select("id")
        .eq("name", "Shoots")
        .is("archived_at", null)
        .single()

      if (!board) {
        setLoading(false)
        return
      }

      // Get column IDs
      const { data: columns } = await supabase
        .from("columns")
        .select("id, name")
        .eq("board_id", board.id)
        .is("archived_at", null)
        .in("name", ["Shoot Time", "Location", "Crew"])

      const shootTimeCol = columns?.find(c => c.name === "Shoot Time")
      const locationCol = columns?.find(c => c.name === "Location")
      const crewCol = columns?.find(c => c.name === "Crew")

      if (!shootTimeCol) {
        setLoading(false)
        return
      }

      // Get all items from Shoots board
      const { data: items } = await supabase
        .from("items")
        .select(`
          id,
          title,
          board_id,
          item_assignees!inner(
            profiles!inner(
              full_name,
              email
            )
          )
        `)
        .eq("board_id", board.id)
        .is("archived_at", null)
        .is("parent_id", null)

      if (!items || items.length === 0) {
        setLoading(false)
        return
      }

      // Get item values for today's shoots
      const itemIds = items.map(i => i.id)
      const { data: values } = await supabase
        .from("item_values")
        .select("item_id, column_id, value")
        .in("item_id", itemIds)
        .in("column_id", [shootTimeCol.id, locationCol?.id, crewCol?.id].filter(Boolean))

      // Build shoot items
      const shootItems: ShootItem[] = []
      
      for (const item of items) {
        const itemValues = values?.filter(v => v.item_id === item.id) || []
        const shootTimeValue = itemValues.find(v => v.column_id === shootTimeCol.id)?.value
        const shootTime = typeof shootTimeValue === 'string' ? shootTimeValue : null
        
        // Check if shoot is today
        if (shootTime) {
          // Parse the shoot time - handle both formats: "dd/mm/yyyy hh:mm am/pm" and ISO format
          let shootDate: Date | null = null
          
          // Try parsing as ISO format first (YYYY-MM-DD)
          if (shootTime.includes('-')) {
            shootDate = new Date(shootTime)
          } else if (shootTime.includes('/')) {
            // Parse "dd/mm/yyyy hh:mm am/pm" format
            const parts = shootTime.split(' ')
            const datePart = parts[0] // "dd/mm/yyyy"
            const [day, month, year] = datePart.split('/').map(Number)
            shootDate = new Date(year, month - 1, day)
          }
          
          if (shootDate && shootDate >= today && shootDate < tomorrow) {
            const locationValue = itemValues.find(v => v.column_id === locationCol?.id)?.value
            const crewValue = itemValues.find(v => v.column_id === crewCol?.id)?.value
            
            const assignees = (item as any).item_assignees || []
            const owner = assignees[0]?.profiles
            
            shootItems.push({
              id: item.id,
              title: item.title,
              shoot_time: shootTime,
              location: typeof locationValue === 'string' ? locationValue : null,
              crew: typeof crewValue === 'string' ? crewValue : null,
              owner_name: owner?.full_name || null,
              owner_email: owner?.email || null,
              board_id: item.board_id
            })
          }
        }
      }

      // Sort by time
      shootItems.sort((a, b) => {
        if (!a.shoot_time) return 1
        if (!b.shoot_time) return -1
        return a.shoot_time.localeCompare(b.shoot_time)
      })

      setShoots(shootItems)
      setLoading(false)
    }

    fetchTodaysShoots()
  }, [workspaceSlug])

  const getCrewColor = (crew: string | null) => {
    if (!crew) return ""
    if (crew.includes("small")) return "bg-gray-500"
    if (crew.includes("medium")) return "bg-blue-500"
    if (crew.includes("large")) return "bg-[#D4AF37]"
    return "bg-gray-500"
  }

  const getCrewName = (crew: string | null) => {
    if (!crew) return null
    if (crew.includes("small")) return "Small"
    if (crew.includes("medium")) return "Medium"
    if (crew.includes("large")) return "Large"
    return crew
  }

  const initials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "?"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Today&apos;s Shoots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Today&apos;s Shoots
          {shoots.length > 0 && (
            <Badge variant="secondary" className="ml-2">{shoots.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shoots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No shoots scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shoots.map((shoot) => (
              <Link
                key={shoot.id}
                href={`/workspace/${workspaceSlug}/board/${shoot.board_id}?item=${shoot.id}`}
                className="block"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-border hover:bg-accent/50 transition-colors">
                  <div className="flex-shrink-0 pt-0.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-[#0A1628]">{shoot.title}</h4>
                      <div className="flex flex-col items-end gap-0.5">
                        {shoot.shoot_time && (
                          <>
                            <span className="text-xs font-medium text-[#0A1628] whitespace-nowrap">
                              {format(new Date(shoot.shoot_time), "h:mm a")}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(shoot.shoot_time), "MMM d, yyyy")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {shoot.location && (
                        <span className="text-xs text-muted-foreground">{shoot.location}</span>
                      )}
                      {getCrewName(shoot.crew) && (
                        <Badge className={`text-xs ${getCrewColor(shoot.crew)} text-white border-0`}>
                          {getCrewName(shoot.crew)} crew
                        </Badge>
                      )}
                      {(shoot.owner_name || shoot.owner_email) && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5 border border-white bg-[#0A1628]">
                            <AvatarFallback className="text-[9px] bg-[#0A1628] text-white">
                              {initials(shoot.owner_name, shoot.owner_email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {shoot.owner_name || shoot.owner_email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
