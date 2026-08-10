"use client"

import { useState } from "react"
import { Bed, Bath, Maximize, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Unit {
  id: string
  unit_type: string
  title: string
  title_fr?: string
  description: string
  description_fr?: string
  starting_price_aed: number
  size_sqft_min: number
  size_sqft_max?: number
  bedrooms: number
  bathrooms: number
  features: string[]
  features_fr?: string[]
}

interface UnitsSectionProps {
  units: Unit[]
  locale: "en" | "fr" | "ar"
  dict: {
    units: {
      title: string
      subtitle: string
      from: string
      sqft: string
      bedrooms: string
      bathrooms: string
      features: string
      viewFloorPlan: string
      registerInterest: string
      types: Record<string, string>
    }
    currency: string
  }
}

export function UnitsSection({ units, locale, dict }: UnitsSectionProps) {
  const [activeUnit, setActiveUnit] = useState(units[0]?.unit_type || "1br")

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CHF") {
      const chfPrice = Math.round(price * 0.24)
      return new Intl.NumberFormat("fr-CH").format(chfPrice)
    }
    return new Intl.NumberFormat("en-AE").format(price)
  }

  const selectedUnit = units.find((u) => u.unit_type === activeUnit) || units[0]

  return (
    <section id="residences" className="py-20 lg:py-32 bg-[#0a0a0a]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Residences</span>
            <div className="h-px w-12 bg-[#C9A962]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
            {dict.units.title}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {dict.units.subtitle}
          </p>
        </div>

        {/* Unit Type Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {units.map((unit) => (
            <button
              key={unit.unit_type}
              onClick={() => setActiveUnit(unit.unit_type)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all duration-300 border",
                activeUnit === unit.unit_type
                  ? "bg-[#C9A962] text-black border-[#C9A962]"
                  : "bg-transparent text-white/70 border-white/20 hover:border-[#C9A962] hover:text-white"
              )}
            >
              {dict.units.types[unit.unit_type] || unit.title}
            </button>
          ))}
        </div>

        {/* Selected Unit Display */}
        {selectedUnit && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image/Render Placeholder */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-white/5 to-white/0 border border-white/10 overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 border border-white/20 rounded-full flex items-center justify-center">
                    <Maximize className="w-10 h-10 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">Floor Plan / Render</p>
                  <p className="text-white/30 text-xs">{locale === "fr" ? selectedUnit.title_fr : selectedUnit.title}</p>
                </div>
              </div>
              {/* Price Tag */}
              <div className="absolute top-6 left-6 bg-[#C9A962] px-4 py-2">
                <p className="text-xs text-black/70 uppercase">{dict.units.from}</p>
                <p className="text-lg font-semibold text-black">{dict.currency} {formatPrice(selectedUnit.starting_price_aed, dict.currency)}</p>
              </div>
            </div>

            {/* Unit Details */}
            <div>
              <h3 className="text-3xl lg:text-4xl font-light text-white mb-4">
                {locale === "fr" ? selectedUnit.title_fr : selectedUnit.title}
              </h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                {locale === "fr" ? selectedUnit.description_fr : selectedUnit.description}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-white/5 border border-white/10">
                <div className="text-center">
                  <Bed className="h-6 w-6 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-white">{selectedUnit.bedrooms}</p>
                  <p className="text-xs text-white/50 uppercase">{dict.units.bedrooms}</p>
                </div>
                <div className="text-center">
                  <Bath className="h-6 w-6 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-white">{selectedUnit.bathrooms}</p>
                  <p className="text-xs text-white/50 uppercase">{dict.units.bathrooms}</p>
                </div>
                <div className="text-center">
                  <Maximize className="h-6 w-6 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-white">
                    {selectedUnit.size_sqft_min}
                    {selectedUnit.size_sqft_max && `-${selectedUnit.size_sqft_max}`}
                  </p>
                  <p className="text-xs text-white/50 uppercase">{dict.units.sqft}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-4">{dict.units.features}</p>
                <div className="grid grid-cols-2 gap-3">
                  {(locale === "fr" && selectedUnit.features_fr ? selectedUnit.features_fr : selectedUnit.features)?.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#C9A962]" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#register" className="flex-1">
                  <Button className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold py-4 rounded-none">
                    {dict.units.registerInterest}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <Button variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10 py-4 rounded-none">
                  {dict.units.viewFloorPlan}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
