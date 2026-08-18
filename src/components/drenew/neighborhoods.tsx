"use client"

import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NEIGHBORHOODS } from "./data"
import { useRef } from "react"

export function Neighborhoods() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section id="neighborhoods" className="py-20 lg:py-32 bg-[#0a0a0a] border-t border-white/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Communities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-2">
              Explore Signature Neighborhoods
            </h2>
            <p className="text-white/60 max-w-xl">
              Discover Dubai&apos;s most prestigious communities, each offering a unique lifestyle experience.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {NEIGHBORHOODS.map((neighborhood) => (
            <div
              key={neighborhood.name}
              className="flex-shrink-0 w-[280px] md:w-[320px] snap-start group cursor-pointer"
            >
              <div className="relative h-96 overflow-hidden border border-white/10 group-hover:border-[#C9A962]/50 transition-all duration-500">
                <Image
                  src={neighborhood.image}
                  alt={neighborhood.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[#C9A962] text-xs uppercase tracking-wider mb-2">
                    {neighborhood.count} Properties
                  </p>
                  <h3 className="text-2xl font-light text-white mb-4">
                    {neighborhood.name}
                  </h3>
                  <div className="flex items-center gap-2 text-white/70 group-hover:text-[#C9A962] transition-colors">
                    <span className="text-sm">Explore</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-none px-8 py-3">
            Explore All Communities
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
