"use client"

import { Instagram, Smartphone, Facebook, FileText, Youtube, Linkedin } from "lucide-react"
import { cn } from "@/lib/utils"
import { TemplateType, TEMPLATE_CONFIGS } from "@/lib/creative-studio/types"

interface TemplatePickerProps {
  selected: TemplateType
  onSelect: (type: TemplateType) => void
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  smartphone: Smartphone,
  facebook: Facebook,
  "file-text": FileText,
  youtube: Youtube,
  linkedin: Linkedin,
}

export function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  const templates = Object.values(TEMPLATE_CONFIGS)

  return (
    <div className="grid grid-cols-3 gap-2">
      {templates.map((template) => {
        const Icon = ICONS[template.icon] || FileText
        const isSelected = selected === template.type

        return (
          <button
            key={template.type}
            onClick={() => onSelect(template.type)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              isSelected && "border-primary bg-primary/5"
            )}
          >
            <Icon className={cn(
              "h-5 w-5",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}>
              {template.label.split(" ")[0]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {template.width}×{template.height}
            </span>
          </button>
        )
      })}
    </div>
  )
}
