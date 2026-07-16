"use client"

import { useEffect, useRef, useState } from "react"
import { CollageImage, CollageSettings, ShapeAnalysis } from "@/lib/collage"
import { renderPreview, createCanvas } from "@/lib/collage"
import { getCanvasDimensions } from "@/lib/collage"
import { Loader2 } from "lucide-react"

interface CollageCanvasProps {
  images: CollageImage[]
  settings: CollageSettings
  shapeSvgPath: string
  shapeAnalysis?: ShapeAnalysis
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

export function CollageCanvas({
  images,
  settings,
  shapeSvgPath,
  shapeAnalysis,
  onCanvasReady,
}: CollageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rendering, setRendering] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!shapeSvgPath || images.length === 0) return

    const renderCanvas = async () => {
      setRendering(true)
      setProgress(0)

      try {
        const { width, height } = getCanvasDimensions(72, 78.74)

        if (!canvasRef.current) {
          canvasRef.current = createCanvas(width, height)
        } else {
          canvasRef.current.width = width
          canvasRef.current.height = height
        }

        await renderPreview(canvasRef.current, {
          images,
          settings,
          shapeSvgPath,
          dpi: 72,
          shapeAnalysis,
          onProgress: (p) => setProgress(p * 100),
        })

        if (containerRef.current && canvasRef.current) {
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(canvasRef.current)
          canvasRef.current.style.maxWidth = '100%'
          canvasRef.current.style.height = 'auto'
          canvasRef.current.style.display = 'block'
          canvasRef.current.style.margin = '0 auto'
        }

        onCanvasReady?.(canvasRef.current)
      } catch (error) {
        console.error('Error rendering canvas:', error)
      } finally {
        setRendering(false)
        setProgress(0)
      }
    }

    const debounceTimer = setTimeout(renderCanvas, 300)
    return () => clearTimeout(debounceTimer)
  }, [images, settings, shapeSvgPath, shapeAnalysis, onCanvasReady])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
      {rendering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">
            Rendering preview... {Math.round(progress)}%
          </p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center p-12">
          <p className="text-muted-foreground">Add images to see preview</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4" />
      )}
    </div>
  )
}
