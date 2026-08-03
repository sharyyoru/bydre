"use client"

import { useState, useMemo } from "react"
import { Search, Building2, MapPin, Calendar, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { GenieMapProject } from "@/lib/creative-studio/types"

interface ProjectSelectorProps {
  projects: GenieMapProject[]
  selected: GenieMapProject | null
  onSelect: (project: GenieMapProject) => void
}

function formatPrice(price: number | null): string {
  if (!price) return ""
  if (price >= 1_000_000) {
    return `AED ${(price / 1_000_000).toFixed(1)}M`
  }
  return `AED ${(price / 1000).toFixed(0)}K`
}

export function ProjectSelector({ projects, selected, onSelect }: ProjectSelectorProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.developer_name?.toLowerCase().includes(q) ||
        p.district_name?.toLowerCase().includes(q)
    )
  }, [projects, search])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No projects found
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selected?.id === project.id}
                onClick={() => onSelect(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  isSelected,
  onClick,
}: {
  project: GenieMapProject
  isSelected: boolean
  onClick: () => void
}) {
  const imageUrl = project.images?.[0] || project.image_url
  const hasImages = (project.images?.length || 0) > 0
  const hasDocs = (project.documents?.length || 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left transition-colors hover:bg-muted/50",
        isSelected && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{project.name}</h3>
          
          {project.developer_name && (
            <p className="text-xs text-muted-foreground truncate">
              {project.developer_name}
            </p>
          )}

          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {project.district_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.district_name}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            {project.price_min && (
              <span className="text-xs font-medium text-primary">
                From {formatPrice(project.price_min)}
              </span>
            )}
            
            {project.status && (
              <Badge 
                variant={project.status === "available" ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {project.status}
              </Badge>
            )}
          </div>

          {/* Asset indicators */}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {hasImages && (
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {project.images.length}
              </span>
            )}
            {hasDocs && (
              <span className="flex items-center gap-1">
                📄 {project.documents.length}
              </span>
            )}
            {project.handover_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(project.handover_date).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
