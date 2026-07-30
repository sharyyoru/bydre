"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, CalendarDays } from "lucide-react"
import { Holiday } from "@/lib/attendance/types"
import { formatDate } from "./format"

export function HolidaysPanel({ workspaceId, isAdmin }: { workspaceId: string; isAdmin: boolean }) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [name, setName] = useState("")
  const [date, setDate] = useState("")

  const load = useCallback(async () => {
    const res = await fetch(`/api/attendance/holidays?workspace_id=${workspaceId}`)
    if (res.ok) setHolidays((await res.json()).holidays || [])
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    if (!name || !date) {
      toast.error("Enter a name and date")
      return
    }
    const res = await fetch("/api/attendance/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, name, holiday_date: date }),
    })
    if (!res.ok) {
      toast.error("Could not add holiday")
      return
    }
    setName(""); setDate("")
    load()
  }

  const remove = async (id: string) => {
    const res = await fetch("/api/attendance/holidays", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id }),
    })
    if (res.ok) setHolidays((h) => h.filter((x) => x.id !== id))
  }

  const now = new Date().toISOString().slice(0, 10)
  const upcoming = holidays.filter((h) => h.holiday_date >= now)
  const past = holidays.filter((h) => h.holiday_date < now)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Holiday</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Holiday name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button onClick={add} className="w-full gap-2 bg-[#0A1628] hover:bg-[#0A1628]/90">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader><CardTitle className="text-base">Holiday Calendar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Upcoming</p>
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming holidays.</p>}
            <div className="space-y-1.5">
              {upcoming.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#D4AF37]" /> {h.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {formatDate(h.holiday_date)}
                    {isAdmin && (
                      <button onClick={() => remove(h.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {past.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Past</p>
              <div className="space-y-1.5 opacity-60">
                {past.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <span>{h.name}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {formatDate(h.holiday_date)}
                      {isAdmin && (
                        <button onClick={() => remove(h.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
