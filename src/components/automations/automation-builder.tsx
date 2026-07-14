"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Zap } from "lucide-react"

export function AutomationBuilder({ boardId, onChange }: { boardId: string; onChange?: () => void }) {
  const [open, setOpen] = useState(false)
  const [automations, setAutomations] = useState<any[]>([])
  const [name, setName] = useState("")
  const [triggerStatus, setTriggerStatus] = useState("Done")
  const [loading, setLoading] = useState(false)

  const fetchAutomations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("automations")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false })
    setAutomations((data as any[]) || [])
  }

  useEffect(() => {
    if (open) fetchAutomations()
  }, [open])

  const addAutomation = async () => {
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("automations").insert({
      board_id: boardId,
      name: name.trim(),
      trigger: "status_changed",
      conditions: [{ column_type: "status", status_name: triggerStatus }],
      actions: [{ type: "notify", message: `Item status changed to ${triggerStatus}` }],
      is_active: true,
    })
    setLoading(false)
    if (error) {
      toast.error("Failed to create automation")
      return
    }
    toast.success("Automation created")
    setName("")
    fetchAutomations()
    onChange?.()
  }

  const toggleAutomation = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase.from("automations").update({ is_active: !isActive }).eq("id", id)
    fetchAutomations()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Automations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Automations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="auto-name">Automation name</Label>
            <Input
              id="auto-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Notify on Done"
            />
          </div>
          <div className="space-y-2">
            <Label>When status changes to</Label>
            <Select value={triggerStatus} onValueChange={setTriggerStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={addAutomation}
            disabled={loading || !name.trim()}
            className="w-full bg-[#0A1628]"
          >
            {loading ? "Creating..." : "Create automation"}
          </Button>

          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-medium">Active automations</h4>
            {automations.length === 0 && (
              <p className="text-sm text-muted-foreground">No automations yet.</p>
            )}
            {automations.map((auto) => (
              <div
                key={auto.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60"
              >
                <div>
                  <p className="text-sm font-medium">{auto.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Status → {auto.conditions?.[0]?.status_name || "Done"}
                  </p>
                </div>
                <Switch
                  checked={auto.is_active}
                  onCheckedChange={() => toggleAutomation(auto.id, auto.is_active)}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
