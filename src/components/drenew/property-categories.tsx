"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"

const CATEGORIES = [
  {
    id: 1,
    type: "OFF-PLAN PROPERTY",
    title: "Hot Property Launches",
    description: "Discover the newest and most sought-after projects fresh on the Dubai market.",
    image: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80",
    accent: true,
  },
  {
    id: 2,
    type: "BUY PROPERTY",
    title: "Top Resale Deals",
    description: "Unlock unbeatable value with handpicked pre-owned homes across prime locations.",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    accent: false,
  },
  {
    id: 3,
    type: "RENT PROPERTY",
    title: "Trending Rental Homes",
    description: "Browse the most in-demand rental listings tailored to your lifestyle and budget.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    accent: false,
  },
]

export function PropertyCategories() {
  return (
    <section className="py-20 lg:py-28 bg-[#0a0a0a] border-t border-white/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Find Your Home</span>
            <div className="h-px w-12 bg-[#C9A962]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white">
            Explore by Category
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500">
                {/* Category Type Header */}
                <div className={`px-6 py-4 ${
                  category.accent 
                    ? "bg-[#C9A962] text-black" 
                    : "bg-white/10 backdrop-blur text-white"
                }`}>
                  <span className="text-xs font-medium tracking-[0.15em]">
                    {category.type}
                  </span>
                </div>

                {/* Image */}
                <div className="relative h-[280px] lg:h-[320px] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6 bg-gradient-to-br from-white/5 to-transparent">
                  <h3 className="text-xl lg:text-2xl font-light text-white mb-3 group-hover:text-[#C9A962] transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {category.description}
                  </p>
                  
                  {/* CTA */}
                  <div className="flex items-center gap-2 text-[#C9A962]">
                    <span className="text-sm font-medium">Browse Properties</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover Line */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "500+", label: "Off-Plan Projects" },
            { value: "2,000+", label: "Properties for Sale" },
            { value: "1,500+", label: "Rental Listings" },
            { value: "50+", label: "Communities" },
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 border border-white/10 bg-white/5">
              <p className="text-3xl lg:text-4xl font-light text-[#C9A962] mb-2">{stat.value}</p>
              <p className="text-sm text-white/50 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
