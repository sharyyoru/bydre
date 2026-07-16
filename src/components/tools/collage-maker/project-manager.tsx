"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CollageProject } from "@/lib/collage"
import { FolderOpen, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ProjectManagerProps {
  onLoad: (project: CollageProject) => void
  workspaceId?: string
}

export function ProjectManager({ onLoad, workspaceId }: ProjectManagerProps) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<CollageProject[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open, workspaceId])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (workspaceId) {
        params.append('workspace_id', workspaceId)
      }

      const response = await fetch(`/api/collage/projects?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setProjects(data.projects || [])
      } else {
        toast.error('Failed to load projects')
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const response = await fetch(`/api/collage/projects/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Project deleted')
        loadProjects()
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleLoad = (project: CollageProject) => {
    onLoad(project)
    setOpen(false)
    toast.success(`Loaded project: ${project.name}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FolderOpen className="h-4 w-4 mr-2" />
          Load Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Load Collage Project</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No saved projects</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.images.length} images • {project.shapeType === 'template' ? project.shapeName : 'Custom shape'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.updatedAt || project.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoad(project)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(project.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface SaveProjectDialogProps {
  onSave: (name: string) => void
  trigger: React.ReactNode
}

export function SaveProjectDialog({ onSave, trigger }: SaveProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a project name')
      return
    }

    onSave(name.trim())
    setOpen(false)
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Collage Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collage"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
