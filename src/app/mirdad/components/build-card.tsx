"use client"

import { useState } from "react"
import { Puzzle, ArrowRight, Cog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Model = {
  id: string
  slug: string
  title: string
  title_fr?: string
  short_description: string
  short_description_fr?: string
  price_aed: number
  piece_count: number
  complexity_level: "beginner" | "intermediate" | "advanced" | "expert"
  category: string
  category_fr?: string
  image_url: string
  stock_status: "in_stock" | "low_stock" | "out_of_stock" | "preorder"
}

interface BuildCardProps {
  model: Model
  locale: "en" | "fr"
  dict: {
    featured: {
      pieces: string
      viewDetails: string
      complexity: Record<string, string>
      stock: Record<string, string>
    }
  }
}

const complexityColors = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  expert: "bg-red-500/10 text-red-400 border-red-500/20",
}

const stockColors = {
  in_stock: "text-green-400",
  low_stock: "text-yellow-400",
  out_of_stock: "text-red-400",
  preorder: "text-blue-400",
}

export function BuildCard({ model, locale, dict }: BuildCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const title = locale === "fr" && model.title_fr ? model.title_fr : model.title
  const description =
    locale === "fr" && model.short_description_fr
      ? model.short_description_fr
      : model.short_description
  const category =
    locale === "fr" && model.category_fr ? model.category_fr : model.category

  const formatPrice = (price: number) => {
    return `AED ${price.toLocaleString("en-AE")}`
  }

  return (
    <article
      id={model.slug}
      className="group relative bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="aspect-[4/3] relative bg-slate-800 overflow-hidden">
        {model.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${model.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Cog className="w-16 h-16 text-slate-700" />
          </div>
        )}

        {/* Overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-slate-900/80 backdrop-blur text-slate-300 border-slate-700"
          >
            {category}
          </Badge>
        </div>

        {/* Stock Status */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "text-xs font-medium",
              stockColors[model.stock_status]
            )}
          >
            {dict.featured.stock[model.stock_status]}
          </span>
        </div>

        {/* Hover Content */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-4 transition-all duration-300",
            isHovered
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          )}
        >
          <p className="text-sm text-slate-300 line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-white text-lg leading-tight">
            {title}
          </h3>
          <p className="text-amber-500 font-bold whitespace-nowrap">
            {formatPrice(model.price_aed)}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 mb-4">
          {/* Piece Count */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Puzzle className="h-4 w-4" />
            <span className="text-sm">
              {model.piece_count.toLocaleString()} {dict.featured.pieces}
            </span>
          </div>

          {/* Complexity */}
          <Badge
            variant="outline"
            className={cn("text-xs", complexityColors[model.complexity_level])}
          >
            {dict.featured.complexity[model.complexity_level]}
          </Badge>
        </div>

        {/* CTA Button */}
        <a href="#contact">
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all min-h-[44px]"
          >
            {dict.featured.viewDetails}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>
    </article>
  )
}
