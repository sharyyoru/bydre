"use client"

import { useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"

const HOT_PROPERTIES = [
  {
    id: 1,
    name: "Binghatti Wraith",
    location: "Al Jaddaf",
    handover: "Q4 2027",
    price: 799999,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    featured: true,
  },
  {
    id: 2,
    name: "Golf Trails",
    location: "Emaar South",
    handover: "Q4 2030",
    price: 1250000,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  },
  {
    id: 3,
    name: "Marea Residences",
    location: "Dubai Islands",
    handover: "Q4 2027",
    price: 2740000,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    featured: true,
  },
  {
    id: 4,
    name: "The Canopies",
    location: "Yas Island",
    handover: "Q3 2030",
    price: 1650000,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  },
  {
    id: 5,
    name: "Damac Lagoons",
    location: "Dubai Land",
    handover: "Q2 2026",
    price: 980000,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
  {
    id: 6,
    name: "Creek Waters",
    location: "Dubai Creek",
    handover: "Q1 2028",
    price: 3200000,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    featured: true,
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-AE").format(price)
}

export function HotProperties() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="py-20 lg:py-28 bg-[#0a0a0a] border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Featured</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white">
              Browse Hot Properties
            </h2>
          </div>
          
          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="w-12 h-12 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all duration-300 group"
            >
              <ChevronLeft className="h-5 w-5 text-white/70 group-hover:text-[#C9A962]" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-12 h-12 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all duration-300 group"
            >
              <ChevronRight className="h-5 w-5 text-white/70 group-hover:text-[#C9A962]" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {HOT_PROPERTIES.map((property) => (
            <div
              key={property.id}
              className="flex-shrink-0 w-[300px] lg:w-[320px] snap-start group cursor-pointer"
            >
              <div className="relative h-[420px] overflow-hidden border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500">
                {/* Image */}
                <Image
                  src={property.image}
                  alt={property.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                
                {/* Handover Badge */}
                <div className="absolute top-4 left-4">
                  <div className={`px-4 py-1.5 text-xs font-medium tracking-wider ${
                    property.featured 
                      ? "bg-[#C9A962] text-black" 
                      : "bg-white/10 backdrop-blur-md border border-white/20 text-white"
                  }`}>
                    Handover: {property.handover}
                  </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-light text-white mb-2 group-hover:text-[#C9A962] transition-colors">
                    {property.name}
                  </h3>
                  
                  <div className="flex items-center text-white/60 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1.5 text-[#C9A962]" />
                    {property.location}
                  </div>
                  
                  {/* Price */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Starting Price:</p>
                    <p className="text-xl font-medium text-white flex items-center gap-1">
                      <span className="text-[#C9A962]">AED</span>
                      {formatPrice(property.price)}
                    </p>
                  </div>
                </div>

                {/* Hover Effect Line */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center justify-center gap-3 mt-6">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-white/70" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 border border-white/20 flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-white/70" />
          </button>
        </div>
      </div>
    </section>
  )
}
