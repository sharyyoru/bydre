"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  QrCode,
  Plus,
  Trash2,
  Building2,
  Home,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComplianceQRCode } from "@/lib/compliance/types"
import { createClient } from "@/lib/supabase/client"

interface QRCodeManagerProps {
  workspaceId: string
  qrCodes: ComplianceQRCode[]
  onUpdate: () => void
}

interface GenieMapProject {
  id: string
  name: string
  developer_name: string | null
}

export function QRCodeManager({ workspaceId, qrCodes, onUpdate }: QRCodeManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<GenieMapProject[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [formType, setFormType] = useState<"company" | "project">("company")
  const [formName, setFormName] = useState("")
  const [formProjectId, setFormProjectId] = useState("")
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formQRData, setFormQRData] = useState("")
  const [formDescription, setFormDescription] = useState("")

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("geniemap_projects")
        .select("id, name, developer_name")
        .eq("workspace_id", workspaceId)
        .order("name")
      
      setProjects(data || [])
    }
    fetchProjects()
  }, [workspaceId])

  const resetForm = () => {
    setFormType("company")
    setFormName("")
    setFormProjectId("")
    setFormImageUrl("")
    setFormQRData("")
    setFormDescription("")
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("Name is required")
      return
    }

    if (formType === "project" && !formProjectId) {
      toast.error("Please select a project")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/compliance/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          type: formType,
          project_id: formType === "project" ? formProjectId : undefined,
          name: formName.trim(),
          image_url: formImageUrl.trim() || undefined,
          qr_data: formQRData.trim() || undefined,
          description: formDescription.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create QR code")
      }

      resetForm()
      setIsOpen(false)
      toast.success("QR code registered successfully")
      onUpdate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (qrCodeId: string) => {
    setDeleting(qrCodeId)
    try {
      const res = await fetch("/api/compliance/qr-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: qrCodeId,
          workspace_id: workspaceId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }

      toast.success("QR code deactivated")
      onUpdate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    } finally {
      setDeleting(null)
    }
  }

  const companyQR = qrCodes.find(qr => qr.type === "company" && qr.is_active)
  const projectQRs = qrCodes.filter(qr => qr.type === "project" && qr.is_active)
  const hasCompanyQR = !!companyQR

  return (
    <div className="space-y-6">
      {/* Company QR Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company QR Code
              </CardTitle>
              <CardDescription>
                The company QR code must appear in all real estate posts
              </CardDescription>
            </div>
            {!hasCompanyQR && (
              <Dialog open={isOpen && formType === "company"} onOpenChange={(open) => {
                setIsOpen(open)
                if (open) setFormType("company")
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company QR
                  </Button>
                </DialogTrigger>
                <QRCodeDialog
                  type="company"
                  name={formName}
                  setName={setFormName}
                  imageUrl={formImageUrl}
                  setImageUrl={setFormImageUrl}
                  qrData={formQRData}
                  setQRData={setFormQRData}
                  description={formDescription}
                  setDescription={setFormDescription}
                  saving={saving}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    resetForm()
                    setIsOpen(false)
                  }}
                />
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {companyQR ? (
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              {companyQR.image_url ? (
                <img
                  src={companyQR.image_url}
                  alt="Company QR"
                  className="h-24 w-24 object-contain border rounded"
                />
              ) : (
                <div className="h-24 w-24 bg-muted rounded flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{companyQR.name}</h4>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                {companyQR.qr_data && (
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {companyQR.qr_data.slice(0, 50)}...
                  </p>
                )}
                {companyQR.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {companyQR.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(companyQR.id)}
                disabled={deleting === companyQR.id}
              >
                {deleting === companyQR.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No company QR code configured</p>
              <p className="text-sm">Add your company QR code to start compliance monitoring</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project QR Codes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Project QR Codes
              </CardTitle>
              <CardDescription>
                Register QR codes for each real estate project
              </CardDescription>
            </div>
            <Dialog open={isOpen && formType === "project"} onOpenChange={(open) => {
              setIsOpen(open)
              if (open) setFormType("project")
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project QR
                </Button>
              </DialogTrigger>
              <QRCodeDialog
                type="project"
                name={formName}
                setName={setFormName}
                projectId={formProjectId}
                setProjectId={setFormProjectId}
                projects={projects}
                imageUrl={formImageUrl}
                setImageUrl={setFormImageUrl}
                qrData={formQRData}
                setQRData={setFormQRData}
                description={formDescription}
                setDescription={setFormDescription}
                saving={saving}
                onSubmit={handleSubmit}
                onCancel={() => {
                  resetForm()
                  setIsOpen(false)
                }}
              />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {projectQRs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No project QR codes registered</p>
              <p className="text-sm">Add QR codes for projects to enable compliance checking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectQRs.map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {qr.image_url ? (
                      <img
                        src={qr.image_url}
                        alt={qr.name}
                        className="h-12 w-12 object-contain border rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                        <QrCode className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{qr.name}</div>
                      {qr.project_name && (
                        <div className="text-sm text-muted-foreground">
                          {qr.project_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(qr.id)}
                    disabled={deleting === qr.id}
                  >
                    {deleting === qr.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Dialog component for adding QR codes
function QRCodeDialog({
  type,
  name,
  setName,
  projectId,
  setProjectId,
  projects,
  imageUrl,
  setImageUrl,
  qrData,
  setQRData,
  description,
  setDescription,
  saving,
  onSubmit,
  onCancel,
}: {
  type: "company" | "project"
  name: string
  setName: (v: string) => void
  projectId?: string
  setProjectId?: (v: string) => void
  projects?: GenieMapProject[]
  imageUrl: string
  setImageUrl: (v: string) => void
  qrData: string
  setQRData: (v: string) => void
  description: string
  setDescription: (v: string) => void
  saving: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {type === "company" ? "Add Company QR Code" : "Add Project QR Code"}
        </DialogTitle>
        <DialogDescription>
          {type === "company"
            ? "This QR code will be required on all real estate posts"
            : "Link a QR code to a specific project"}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "company" ? "Company QR Code" : "Project QR Code"}
          />
        </div>

        {type === "project" && projects && setProjectId && (
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                    {project.developer_name && ` (${project.developer_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="imageUrl">QR Code Image URL</Label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            Upload your QR code image to a hosting service and paste the URL
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qrData">QR Code Content</Label>
          <Input
            id="qrData"
            value={qrData}
            onChange={(e) => setQRData(e.target.value)}
            placeholder="URL or text encoded in the QR code"
          />
          <p className="text-xs text-muted-foreground">
            The URL or text that the QR code decodes to (for matching)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save QR Code
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
