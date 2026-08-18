"use client"

import { useState } from "react"
import { Search, ChevronDown, Building2, Users, Award, Calendar, ArrowRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AREAS, PROPERTY_TYPES, BEDROOM_OPTIONS, PRICE_RANGES, STATS } from "./data"

export function HeroSection() {
  const [propertyType, setPropertyType] = useState("buy")
  const [area, setArea] = useState("All Areas")
  const [beds, setBeds] = useState("any")
  const [price, setPrice] = useState("any")

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-0">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0a]" />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80')`,
            filter: "brightness(0.4)"
          }}
        />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-20 lg:py-0 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm font-medium tracking-[0.2em] uppercase">
                Dubai&apos;s Premier Real Estate
              </span>
              <div className="h-px w-8 bg-[#C9A962]" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.1] tracking-tight">
              <span className="font-extralight">Find Your</span>
              <br />
              <span className="font-semibold bg-gradient-to-r from-white via-[#C9A962] to-white bg-clip-text text-transparent">
                DREam Home
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Connecting you to Dubai&apos;s premium properties through trusted expertise, 
              strategic market insight, and personalized solutions.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <a href="#properties">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold min-h-[56px] px-10 text-base rounded-none"
                >
                  Explore Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 min-h-[56px] px-10 text-base rounded-none backdrop-blur"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Brochure
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-white/5 backdrop-blur-lg border border-white/10">
              {STATS.map((stat, index) => {
                const icons = [Calendar, Users, Award, Building2]
                const Icon = icons[index]
                return (
                  <div key={stat.label} className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <Icon className="h-4 w-4 text-[#C9A962]" />
                      <span className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-white">
                      {stat.value}{stat.suffix}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Search Form (Desktop) */}
          <div className="hidden lg:block">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
              <h3 className="text-2xl font-light text-white mb-2">Find Your Property</h3>
              <p className="text-white/60 mb-6">Search from 5000+ premium listings</p>
              
              <div className="space-y-4">
                {/* Property Type Tabs */}
                <div className="flex gap-2">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPropertyType(type.value)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 border ${
                        propertyType === type.value
                          ? "bg-[#C9A962] text-black border-[#C9A962]"
                          : "bg-transparent text-white/70 border-white/20 hover:border-[#C9A962] hover:text-white"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Location */}
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A962]"
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a} className="bg-[#0a0a0a]">{a}</option>
                  ))}
                </select>

                {/* Bedrooms */}
                <select
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A962]"
                >
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">{opt.label}</option>
                  ))}
                </select>

                {/* Price Range */}
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A962]"
                >
                  {PRICE_RANGES.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">{opt.label}</option>
                  ))}
                </select>

                <Button
                  className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold py-4 text-base rounded-none"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Properties
                </Button>
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 mb-2">Popular Searches:</p>
                <div className="flex flex-wrap gap-2">
                  {["Downtown", "Palm Jumeirah", "Marina", "Dubai Hills"].map((area) => (
                    <span
                      key={area}
                      className="text-xs text-[#C9A962] hover:underline cursor-pointer"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-2">
        <span className="text-xs text-white/40 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[#C9A962] to-transparent" />
      </div>
    </section>
  )
}
