"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Gift,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { ProjectCommission, CommissionInput } from "@/lib/sales-brain/types"

interface CommissionEditorProps {
  workspaceId: string
}

export function CommissionEditor({ workspaceId }: CommissionEditorProps) {
  const [commissions, setCommissions] = useState<ProjectCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState<CommissionInput>({
    project_name: "",
    developer_name: "",
    base_commission_percent: 0,
    early_bird_bonus_percent: 0,
    early_bird_deadline: "",
    volume_bonus_percent: 0,
    volume_threshold: 0,
    payment_terms: "",
    special_incentives: "",
    notes: "",
  })

  useEffect(() => {
    fetchCommissions()
  }, [workspaceId])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales-brain/commissions?workspace_id=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setCommissions(data.commissions || [])
      }
    } catch (err) {
      console.error("Fetch commissions error:", err)
      toast.error("Failed to load commissions")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      project_name: "",
      developer_name: "",
      base_commission_percent: 0,
      early_bird_bonus_percent: 0,
      early_bird_deadline: "",
      volume_bonus_percent: 0,
      volume_threshold: 0,
      payment_terms: "",
      special_incentives: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (commission: ProjectCommission) => {
    setForm({
      project_name: commission.project_name,
      project_id: commission.project_id || undefined,
      developer_name: commission.developer_name || "",
      base_commission_percent: commission.base_commission_percent,
      early_bird_bonus_percent: commission.early_bird_bonus_percent || 0,
      early_bird_deadline: commission.early_bird_deadline || "",
      volume_bonus_percent: commission.volume_bonus_percent || 0,
      volume_threshold: commission.volume_threshold || 0,
      payment_terms: commission.payment_terms || "",
      special_incentives: commission.special_incentives || "",
      notes: commission.notes || "",
    })
    setEditingId(commission.id)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.project_name || form.base_commission_percent === undefined) {
      toast.error("Project name and base commission are required")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        // Update existing
        const res = await fetch("/api/sales-brain/commissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            commission_id: editingId,
            ...form,
          }),
        })
        if (res.ok) {
          toast.success("Commission updated")
          fetchCommissions()
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error("Failed to update commission")
        }
      } else {
        // Create new
        const res = await fetch("/api/sales-brain/commissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            ...form,
          }),
        })
        if (res.ok) {
          toast.success("Commission added")
          fetchCommissions()
          setDialogOpen(false)
          resetForm()
        } else {
          toast.error("Failed to add commission")
        }
      }
    } catch {
      toast.error("Failed to save commission")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this commission entry?")) return

    try {
      const res = await fetch(
        `/api/sales-brain/commissions?workspace_id=${workspaceId}&commission_id=${id}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        toast.success("Commission deleted")
        fetchCommissions()
      } else {
        toast.error("Failed to delete commission")
      }
    } catch {
      toast.error("Failed to delete commission")
    }
  }

  const totalCommission = (c: ProjectCommission) => {
    return c.base_commission_percent + (c.early_bird_bonus_percent || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Commission Tracker</h3>
          <p className="text-sm text-muted-foreground">
            Track developer commission rates to optimize earnings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Commission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Commission" : "Add Commission"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    value={form.project_name}
                    onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                    placeholder="DAMAC Lagoons"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Developer</Label>
                  <Input
                    value={form.developer_name}
                    onChange={(e) => setForm({ ...form, developer_name: e.target.value })}
                    placeholder="DAMAC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Base Commission % *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.base_commission_percent}
                    onChange={(e) => setForm({ ...form, base_commission_percent: parseFloat(e.target.value) || 0 })}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Early Bird Bonus %</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.early_bird_bonus_percent || ""}
                    onChange={(e) => setForm({ ...form, early_bird_bonus_percent: parseFloat(e.target.value) || 0 })}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Deadline</Label>
                  <Input
                    type="date"
                    value={form.early_bird_deadline || ""}
                    onChange={(e) => setForm({ ...form, early_bird_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Volume Bonus %</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.volume_bonus_percent || ""}
                    onChange={(e) => setForm({ ...form, volume_bonus_percent: parseFloat(e.target.value) || 0 })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volume Threshold (units)</Label>
                  <Input
                    type="number"
                    value={form.volume_threshold || ""}
                    onChange={(e) => setForm({ ...form, volume_threshold: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input
                  value={form.payment_terms || ""}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  placeholder="50% on booking, 50% on handover"
                />
              </div>

              <div className="space-y-2">
                <Label>Special Incentives</Label>
                <Input
                  value={form.special_incentives || ""}
                  onChange={(e) => setForm({ ...form, special_incentives: e.target.value })}
                  placeholder="Free Dubai trip for 3+ sales"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Update" : "Add"} Commission
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {commissions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No commissions tracked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add developer commission rates to help AI recommend higher-earning projects.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Commission
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead className="text-right">Base %</TableHead>
                  <TableHead className="text-right">Bonus %</TableHead>
                  <TableHead className="text-right">Total %</TableHead>
                  <TableHead>Incentives</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.project_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.developer_name || "—"}
                    </TableCell>
                    <TableCell className="text-right">{c.base_commission_percent}%</TableCell>
                    <TableCell className="text-right">
                      {c.early_bird_bonus_percent ? (
                        <div className="flex items-center justify-end gap-1">
                          <span>+{c.early_bird_bonus_percent}%</span>
                          {c.early_bird_deadline && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(c.early_bird_deadline).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-[#D4AF37] text-black">
                        {totalCommission(c)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.special_incentives && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Gift className="h-3 w-3" />
                          <span className="truncate max-w-32">{c.special_incentives}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {commissions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Projects Tracked</p>
              <p className="text-2xl font-bold">{commissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Highest Commission</p>
              <p className="text-2xl font-bold text-[#D4AF37]">
                {Math.max(...commissions.map(totalCommission))}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Avg Commission</p>
              <p className="text-2xl font-bold">
                {(commissions.reduce((s, c) => s + totalCommission(c), 0) / commissions.length).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
