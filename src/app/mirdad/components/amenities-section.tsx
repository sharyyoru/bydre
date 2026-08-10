"use client"

import { useState } from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

interface Amenity {
  id: string
  name: string
  name_fr?: string
  icon: string
  category: string
}

interface AmenitiesSectionProps {
  amenities: Amenity[]
  locale: "en" | "fr"
  dict: {
    amenities: {
      title: string
      subtitle: string
      categories: Record<string, string>
    }
  }
}

const categories = ["all", "fitness", "leisure", "family", "business", "sustainability", "general"]

export function AmenitiesSection({ amenities, locale, dict }: AmenitiesSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredAmenities = activeCategory === "all" 
    ? amenities 
    : amenities.filter((a) => a.category === activeCategory)

  const getIcon = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as any
    return icons[iconName] || LucideIcons.Star
  }

  return (
    <section id="amenities" className="py-20 lg:py-32 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Amenities</span>
            <div className="h-px w-12 bg-[#C9A962]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
            {dict.amenities.title}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {dict.amenities.subtitle}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2 text-sm transition-all duration-300 border rounded-full",
                activeCategory === cat
                  ? "bg-[#C9A962] text-black border-[#C9A962]"
                  : "bg-transparent text-white/60 border-white/20 hover:border-[#C9A962] hover:text-white"
              )}
            >
              {dict.amenities.categories[cat] || cat}
            </button>
          ))}
        </div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAmenities.map((amenity) => {
            const Icon = getIcon(amenity.icon)
            return (
              <div
                key={amenity.id}
                className="group p-6 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 hover:bg-white/10 transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#C9A962]/10 flex items-center justify-center group-hover:bg-[#C9A962]/20 transition-colors">
                  <Icon className="w-6 h-6 text-[#C9A962]" />
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {locale === "fr" ? amenity.name_fr : amenity.name}
                </p>
              </div>
            )
          })}
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-8 border border-white/10 bg-white/5">
            <div className="text-5xl font-light text-[#C9A962] mb-2">50%</div>
            <p className="text-white/60">EV Charging Ready Parking</p>
          </div>
          <div className="text-center p-8 border border-white/10 bg-white/5">
            <div className="text-5xl font-light text-[#C9A962] mb-2">24/7</div>
            <p className="text-white/60">Security & Concierge</p>
          </div>
          <div className="text-center p-8 border border-white/10 bg-white/5">
            <div className="text-5xl font-light text-[#C9A962] mb-2">LEED</div>
            <p className="text-white/60">Green Building Certified</p>
          </div>
        </div>
      </div>
    </section>
  )
}
