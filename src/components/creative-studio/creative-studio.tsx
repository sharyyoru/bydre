"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { resolveWorkspaceId } from "@/lib/workspace-client"
import { toast } from "sonner"
import { Sparkles, Settings, Download, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectSelector } from "./project-selector"
import { TemplatePicker } from "./template-picker"
import { CanvasPreview } from "./canvas-preview"
import { BrandingSettings } from "./branding-settings"
import { 
  TemplateType, 
  BrandingType, 
  ContentStyle, 
  GenieMapProject, 
  GeneratedContent,
  AgentBranding,
  TEMPLATE_CONFIGS 
} from "@/lib/creative-studio/types"

export function CreativeStudio({ workspaceId: workspaceIdentifier }: { workspaceId: string }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [projects, setProjects] = useState<GenieMapProject[]>([])
  const [selectedProject, setSelectedProject] = useState<GenieMapProject | null>(null)
  const [templateType, setTemplateType] = useState<TemplateType>("instagram_post")
  const [brandingType, setBrandingType] = useState<BrandingType>("company")
  const [style, setStyle] = useState<ContentStyle>("luxury")
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [branding, setBranding] = useState<AgentBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showBrandingSettings, setShowBrandingSettings] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    resolveWorkspaceId(supabase, workspaceIdentifier).then((id) => {
      if (id) setWorkspaceId(id)
      else setLoading(false)
    })
  }, [workspaceIdentifier])

  const loadProjects = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("geniemap_projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name")
    
    if (error) {
      toast.error("Failed to load projects")
      console.error(error)
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }, [workspaceId])

  const loadBranding = useCallback(async () => {
    if (!workspaceId) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("agent_branding")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    
    if (data) setBranding(data)
  }, [workspaceId])

  useEffect(() => {
    if (workspaceId) {
      loadProjects()
      loadBranding()
    }
  }, [workspaceId, loadProjects, loadBranding])

  const generateContent = async () => {
    if (!selectedProject || !workspaceId) {
      toast.error("Please select a project first")
      return
    }

    setGenerating(true)
    try {
      const res = await fetch("/api/creative-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: selectedProject.id,
          template_type: templateType,
          branding_type: brandingType,
          style,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Generation failed")
      }

      const data = await res.json()
      setGeneratedContent(data.content)
      toast.success("Content generated!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const exportToCanva = async () => {
    if (!generatedContent || !selectedProject) {
      toast.error("Generate content first")
      return
    }

    toast.info("Canva export coming soon! For now, copy the content and use Canva directly.")
  }

  if (loading && !projects.length) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Creative Studio</h1>
            <p className="text-sm text-muted-foreground">
              Generate marketing content from your projects
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBrandingSettings(true)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Branding
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Project Selection */}
        <div className="w-80 border-r overflow-y-auto">
          <ProjectSelector
            projects={projects}
            selected={selectedProject}
            onSelect={setSelectedProject}
          />
        </div>

        {/* Center - Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Template & Style Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplatePicker
                    selected={templateType}
                    onSelect={setTemplateType}
                  />
                  
                  <div className="mt-4 flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Style</label>
                      <select
                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={style}
                        onChange={(e) => setStyle(e.target.value as ContentStyle)}
                      >
                        <option value="luxury">Luxury</option>
                        <option value="modern">Modern</option>
                        <option value="minimal">Minimal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Branding</label>
                      <select
                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={brandingType}
                        onChange={(e) => setBrandingType(e.target.value as BrandingType)}
                      >
                        <option value="company">Company</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    className="mt-4 w-full"
                    onClick={generateContent}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <CanvasPreview
                project={selectedProject}
                content={generatedContent}
                templateType={templateType}
                branding={brandingType === "personal" ? branding : null}
              />

              {/* Actions */}
              {generatedContent && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={exportToCanva}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Canva
                  </Button>
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div className="max-w-sm">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Select a Project</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a project from the list to start generating marketing content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branding Settings Modal */}
      {showBrandingSettings && (
        <BrandingSettings
          workspaceId={workspaceId!}
          branding={branding}
          onSave={(b: AgentBranding) => {
            setBranding(b)
            setShowBrandingSettings(false)
          }}
          onClose={() => setShowBrandingSettings(false)}
        />
      )}
    </div>
  )
}
