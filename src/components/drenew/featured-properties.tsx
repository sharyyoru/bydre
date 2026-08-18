"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin, Bed, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FEATURED_PROPERTIES } from "./data"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "off-plan", label: "Off-Plan" },
  { value: "ready", label: "Ready" },
  { value: "luxury", label: "Luxury" },
]

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  }
  return `${(price / 1000).toFixed(0)}K`
}

export function FeaturedProperties() {
  const [activeFilter, setActiveFilter] = useState("all")

  const filteredProperties = FEATURED_PROPERTIES.filter(
    (p) => activeFilter === "all" || p.type === activeFilter
  )

  return (
    <section id="properties" className="py-20 lg:py-32 bg-[#0a0a0a]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Featured Properties</span>
            <div className="h-px w-12 bg-[#C9A962]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
            Discover Your Perfect Home
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Explore our handpicked selection of premium properties across Dubai&apos;s most sought-after locations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-6 py-3 text-sm font-medium transition-all duration-300 border ${
                activeFilter === filter.value
                  ? "bg-[#C9A962] text-black border-[#C9A962]"
                  : "bg-transparent text-white/70 border-white/20 hover:border-[#C9A962] hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Properties Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="group bg-gradient-to-br from-white/5 to-white/0 border border-white/10 overflow-hidden hover:border-[#C9A962]/50 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={property.image}
                  alt={property.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Badge */}
                {property.badge && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-xs font-semibold bg-[#C9A962] text-black">
                      {property.badge}
                    </span>
                  </div>
                )}
                {/* Price Tag */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-xs text-white/70 uppercase">From</p>
                  <p className="text-lg font-semibold text-white">AED {formatPrice(property.priceFrom)}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-xs text-[#C9A962] uppercase tracking-wider mb-1">{property.developer}</p>
                <h3 className="text-lg font-light text-white mb-2 group-hover:text-[#C9A962] transition-colors">
                  {property.name}
                </h3>
                <div className="flex items-center text-white/50 text-sm mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.location}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 border border-white/10">
                  <div className="text-center">
                    <Bed className="h-4 w-4 text-[#C9A962] mx-auto mb-1" />
                    <p className="text-sm font-semibold text-white">{property.beds}</p>
                    <p className="text-[10px] text-white/50 uppercase">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-4 w-4 text-[#C9A962] mx-auto mb-1" />
                    <p className="text-sm font-semibold text-white">{property.handover}</p>
                    <p className="text-[10px] text-white/50 uppercase">Handover</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-none px-8 py-3">
            View All Properties
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
