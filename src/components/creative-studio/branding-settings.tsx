"use client"

import { useState } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { AgentBranding } from "@/lib/creative-studio/types"

interface BrandingSettingsProps {
  workspaceId: string
  branding: AgentBranding | null
  onSave: (branding: AgentBranding) => void
  onClose: () => void
}

export function BrandingSettings({ workspaceId, branding, onSave, onClose }: BrandingSettingsProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    display_name: branding?.display_name || "",
    phone: branding?.phone || "",
    email: branding?.email || "",
    tagline: branding?.tagline || "",
    primary_color: branding?.primary_color || "#0f172a",
    secondary_color: branding?.secondary_color || "#3b82f6",
    photo_url: branding?.photo_url || "",
    logo_url: branding?.logo_url || "",
  })

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const payload = {
        user_id: user.id,
        workspace_id: workspaceId,
        ...form,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("agent_branding")
        .upsert(payload, { onConflict: "user_id,workspace_id" })
        .select()
        .single()

      if (error) throw error
      
      toast.success("Branding saved!")
      onSave(data as AgentBranding)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold">Personal Branding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize how your contact info appears on generated content
        </p>

        <div className="mt-6 space-y-4">
          {/* Photo URL */}
          <div className="grid gap-2">
            <Label>Profile Photo URL</Label>
            <Input
              placeholder="https://example.com/photo.jpg"
              value={form.photo_url}
              onChange={(e) => updateField("photo_url", e.target.value)}
            />
          </div>

          {/* Display Name */}
          <div className="grid gap-2">
            <Label>Display Name</Label>
            <Input
              placeholder="John Smith"
              value={form.display_name}
              onChange={(e) => updateField("display_name", e.target.value)}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                placeholder="+971 50 123 4567"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="grid gap-2">
            <Label>Tagline</Label>
            <Input
              placeholder="Your trusted real estate partner"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.secondary_color}
                  onChange={(e) => updateField("secondary_color", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <Input
                  value={form.secondary_color}
                  onChange={(e) => updateField("secondary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Company Logo */}
          <div className="grid gap-2">
            <Label>Logo URL (optional)</Label>
            <Input
              placeholder="https://example.com/logo.png"
              value={form.logo_url}
              onChange={(e) => updateField("logo_url", e.target.value)}
            />
          </div>
        </div>

        {/* Preview */}
        {(form.photo_url || form.display_name) && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-3">
              {form.photo_url && (
                <img
                  src={form.photo_url}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover border-2"
                  style={{ borderColor: form.primary_color }}
                />
              )}
              <div>
                <div className="font-medium" style={{ color: form.primary_color }}>
                  {form.display_name || "Your Name"}
                </div>
                {form.phone && (
                  <div className="text-sm text-muted-foreground">{form.phone}</div>
                )}
                {form.tagline && (
                  <div className="text-xs text-muted-foreground italic">{form.tagline}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Branding"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
