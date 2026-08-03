"use client"

import { useState } from "react"
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  TemplateType, 
  GenieMapProject, 
  GeneratedContent,
  AgentBranding,
  TEMPLATE_CONFIGS 
} from "@/lib/creative-studio/types"

interface CanvasPreviewProps {
  project: GenieMapProject
  content: GeneratedContent | null
  templateType: TemplateType
  branding: AgentBranding | null
}

export function CanvasPreview({ project, content, templateType, branding }: CanvasPreviewProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)

  const config = TEMPLATE_CONFIGS[templateType]
  const images = project.images?.length > 0 ? project.images : project.image_url ? [project.image_url] : []
  const currentImage = images[imageIndex] || null

  const aspectRatio = config.width / config.height
  const isVertical = aspectRatio < 1
  const isSquare = Math.abs(aspectRatio - 1) < 0.1

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success(`${field} copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  const prevImage = () => {
    setImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))
  }

  const nextImage = () => {
    setImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Preview
          <Badge variant="outline" className="font-normal">
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Preview */}
        <div className="flex justify-center">
          <div
            className={cn(
              "relative bg-muted rounded-lg overflow-hidden border shadow-sm",
              isVertical ? "w-48" : isSquare ? "w-72" : "w-full max-w-md"
            )}
            style={{ aspectRatio: `${config.width} / ${config.height}` }}
          >
            {/* Background Image */}
            {currentImage ? (
              <img
                src={currentImage}
                alt={project.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              {content ? (
                <>
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                    {content.headline}
                  </h3>
                  <p className="mt-1 text-white/90 text-sm line-clamp-3 drop-shadow">
                    {content.body_copy}
                  </p>
                  {content.cta && (
                    <span className="mt-2 inline-block bg-white text-black text-xs font-semibold px-3 py-1 rounded-full w-fit">
                      {content.cta}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-white/90 text-sm drop-shadow">
                    {project.developer_name} • {project.district_name}
                  </p>
                </>
              )}

              {/* Branding */}
              {branding && (
                <div className="mt-3 flex items-center gap-2">
                  {branding.photo_url && (
                    <img
                      src={branding.photo_url}
                      alt={branding.display_name || "Agent"}
                      className="h-8 w-8 rounded-full border-2 border-white object-cover"
                    />
                  )}
                  <div className="text-white text-xs">
                    <div className="font-medium">{branding.display_name}</div>
                    {branding.phone && <div className="opacity-80">{branding.phone}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === imageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Generated Content Fields */}
        {content && (
          <div className="space-y-3 pt-4 border-t">
            <CopyField
              label="Headline"
              value={content.headline}
              copied={copied === "Headline"}
              onCopy={() => copyToClipboard(content.headline, "Headline")}
            />
            <CopyField
              label="Body Copy"
              value={content.body_copy}
              copied={copied === "Body Copy"}
              onCopy={() => copyToClipboard(content.body_copy, "Body Copy")}
              multiline
            />
            {content.hashtags?.length > 0 && (
              <CopyField
                label="Hashtags"
                value={content.hashtags.map(h => `#${h}`).join(" ")}
                copied={copied === "Hashtags"}
                onCopy={() => copyToClipboard(content.hashtags.map(h => `#${h}`).join(" "), "Hashtags")}
              />
            )}
            <CopyField
              label="Call to Action"
              value={content.cta}
              copied={copied === "CTA"}
              onCopy={() => copyToClipboard(content.cta, "CTA")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CopyField({
  label,
  value,
  copied,
  onCopy,
  multiline = false,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  multiline?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      {multiline ? (
        <Textarea
          value={value}
          readOnly
          className="text-sm resize-none"
          rows={3}
        />
      ) : (
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          {value}
        </div>
      )}
    </div>
  )
}
