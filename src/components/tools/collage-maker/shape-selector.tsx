"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SHAPE_TEMPLATES, parseCustomSvg, normalizeSvgPath } from "@/lib/collage"
import { Upload } from "lucide-react"
import { toast } from "sonner"

interface ShapeSelectorProps {
  selectedShape: string
  customSvgPath?: string
  onShapeSelect: (shapeName: string, svgPath: string, isCustom: boolean) => void
}

export function ShapeSelector({ selectedShape, customSvgPath, onShapeSelect }: ShapeSelectorProps) {
  const [uploading, setUploading] = useState(false)

  const handleTemplateSelect = (shapeName: string, svgPath: string) => {
    onShapeSelect(shapeName, svgPath, false)
  }

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes('svg')) {
      toast.error('Please upload an SVG file')
      return
    }

    setUploading(true)
    try {
      const text = await file.text()
      const parsed = parseCustomSvg(text)

      if (!parsed) {
        toast.error('Invalid SVG file. Please ensure it contains valid path elements.')
        return
      }

      const normalizedPath = normalizeSvgPath(parsed.path, parsed.viewBox)
      onShapeSelect('custom', normalizedPath, true)
      toast.success('Custom shape uploaded successfully')
    } catch (error) {
      console.error('Error uploading SVG:', error)
      toast.error('Failed to process SVG file')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">Select Shape</Label>
        <div className="grid grid-cols-3 gap-3">
          {SHAPE_TEMPLATES.map((template) => (
            <button
              key={template.name}
              onClick={() => handleTemplateSelect(template.name, template.svgPath)}
              className={`p-4 border-2 rounded-lg hover:border-primary transition-colors ${
                selectedShape === template.name && !customSvgPath
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="aspect-square flex items-center justify-center mb-2">
                <svg viewBox="0 0 1 1" className="w-full h-full">
                  <path d={template.svgPath} fill="currentColor" />
                </svg>
              </div>
              <p className="text-xs text-center font-medium">{template.displayName}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Custom Shape</Label>
        <div className="relative">
          <input
            type="file"
            accept=".svg"
            onChange={handleCustomUpload}
            className="hidden"
            id="svg-upload"
            disabled={uploading}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById('svg-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload SVG Shape'}
          </Button>
        </div>
        {customSvgPath && (
          <div className="mt-3 p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Custom shape preview:</p>
            <div className="aspect-square w-20 mx-auto">
              <svg viewBox="0 0 1 1" className="w-full h-full">
                <path d={customSvgPath} fill="currentColor" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
