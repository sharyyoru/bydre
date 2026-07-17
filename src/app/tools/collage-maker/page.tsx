"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ShapeSelector } from "@/components/tools/collage-maker/shape-selector"
import { ImageLibrary } from "@/components/tools/collage-maker/image-library"
import { ControlsPanel } from "@/components/tools/collage-maker/controls-panel"
import { CollageCanvas } from "@/components/tools/collage-maker/collage-canvas"
import { ProjectManager, SaveProjectDialog } from "@/components/tools/collage-maker/project-manager"
import { ExportDialog } from "@/components/tools/collage-maker/export-dialog"
import { CollageImage, CollageSettings, CollageProject, SHAPE_TEMPLATES, ShapeAnalysis } from "@/lib/collage"
import { createCanvas, renderExport } from "@/lib/collage"
import { getCanvasDimensions, exportWithProgress, analyzeShape, getShapeAspectRatio } from "@/lib/collage"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function CollageMakerPage() {
  const [selectedShape, setSelectedShape] = useState("heart")
  const [shapeSvgPath, setShapeSvgPath] = useState(SHAPE_TEMPLATES[0].svgPath)
  const [isCustomShape, setIsCustomShape] = useState(false)
  const [images, setImages] = useState<CollageImage[]>([])
  const [settings, setSettings] = useState<CollageSettings>({
    gridRows: 10,
    gridCols: 10,
    padding: 5,
    effect: 'color',
  })
  const [shapeAnalysis, setShapeAnalysis] = useState<ShapeAnalysis | undefined>()

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStage, setExportStage] = useState('')
  const [exportComplete, setExportComplete] = useState(false)

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (shapeSvgPath) {
      const aspectRatio = getShapeAspectRatio(selectedShape)
      const analysis = analyzeShape(shapeSvgPath, images.length || 100, aspectRatio)
      setShapeAnalysis(analysis)
    }
  }, [shapeSvgPath, selectedShape, images.length])

  const handleShapeSelect = (shapeName: string, svgPath: string, isCustom: boolean) => {
    setSelectedShape(shapeName)
    setShapeSvgPath(svgPath)
    setIsCustomShape(isCustom)
  }

  const handleImagesAdd = (newImages: CollageImage[]) => {
    setImages((prev) => [...prev, ...newImages])
  }

  const handleImageRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleImagesReorder = (reorderedImages: CollageImage[]) => {
    setImages(reorderedImages)
  }

  const handleSettingsChange = (newSettings: Partial<CollageSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const handleSaveProject = async (name: string) => {
    try {
      const projectData = {
        name,
        workspace_id: null,
        shape_type: isCustomShape ? 'custom' : 'template',
        shape_name: isCustomShape ? undefined : selectedShape,
        shape_svg_path: shapeSvgPath,
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          thumbnail: img.thumbnail,
          order: img.order,
        })),
        settings,
      }

      const url = currentProjectId
        ? `/api/collage/projects/${currentProjectId}`
        : '/api/collage/projects'

      const response = await fetch(url, {
        method: currentProjectId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentProjectId(data.project.id)
        toast.success(`Project ${currentProjectId ? 'updated' : 'saved'} successfully`)
      } else {
        toast.error(data.error || 'Failed to save project')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Failed to save project')
    }
  }

  const handleLoadProject = (project: CollageProject) => {
    setCurrentProjectId(project.id || null)
    setSelectedShape(project.shapeName || 'custom')
    setShapeSvgPath(project.shapeSvgPath)
    setIsCustomShape(project.shapeType === 'custom')
    setImages(project.images)
    setSettings(project.settings)
  }

  const handleExport = async () => {
    if (images.length === 0) {
      toast.error('Please add images before exporting')
      return
    }

    setExporting(true)
    setExportDialogOpen(true)
    setExportComplete(false)
    setExportProgress(0)

    try {
      const { width, height } = getCanvasDimensions(200, 78.74)

      const exportCanvas = createCanvas(width, height)

      await renderExport(exportCanvas, {
        images,
        settings,
        shapeSvgPath,
        shapeName: isCustomShape ? undefined : selectedShape,
        dpi: 200,
        shapeAnalysis,
        onProgress: (p) => setExportProgress(p),
      })

      const filename = `collage-${Date.now()}.png`
      await exportWithProgress(exportCanvas, filename, (stage, progress) => {
        setExportStage(stage)
        setExportProgress(progress)
      })

      setExportComplete(true)
      toast.success('Collage exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export collage')
      setExportDialogOpen(false)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collage Maker</h1>
            <p className="text-muted-foreground">
              Create high-resolution photo collages for print
            </p>
          </div>
          <ProjectManager onLoad={handleLoadProject} />
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
          <div className="col-span-3 border rounded-lg overflow-hidden flex flex-col">
            <ImageLibrary
              images={images}
              onImagesAdd={handleImagesAdd}
              onImageRemove={handleImageRemove}
              onImagesReorder={handleImagesReorder}
              maxImages={500}
            />
          </div>

          <div className="col-span-6 border rounded-lg overflow-hidden">
            <CollageCanvas
              images={images}
              settings={settings}
              shapeSvgPath={shapeSvgPath}
              shapeName={isCustomShape ? undefined : selectedShape}
              shapeAnalysis={shapeAnalysis}
              onCanvasReady={(canvas) => {
                previewCanvasRef.current = canvas
              }}
            />
          </div>

          <div className="col-span-3 border rounded-lg overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-3">Shape</h3>
                <ShapeSelector
                  selectedShape={selectedShape}
                  customSvgPath={isCustomShape ? shapeSvgPath : undefined}
                  onShapeSelect={handleShapeSelect}
                />
              </div>

              <div className="border-b">
                <ControlsPanel
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onExport={handleExport}
                  onSave={() => {}}
                  canExport={images.length > 0}
                  exporting={exporting}
                  shapeAnalysis={shapeAnalysis}
                />
              </div>

              <div className="p-4">
                <SaveProjectDialog
                  onSave={handleSaveProject}
                  trigger={
                    <Button variant="outline" className="w-full">
                      Save Project
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        exportProgress={exportProgress}
        exportStage={exportStage}
        exportComplete={exportComplete}
      />
    </AppShell>
  )
}
