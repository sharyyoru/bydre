"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const NEIGHBORHOODS = [
  {
    id: 1,
    name: "Business Bay",
    description: "Live surrounded by luxury, skyline views, and vibrant urban living.",
    properties: 48,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  },
  {
    id: 2,
    name: "Damac Hills 2",
    description: "A waterfront-inspired community offering resort-style living in Dubai.",
    properties: 21,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
  {
    id: 3,
    name: "Dubai Marina",
    description: "Iconic waterfront living with world-class dining and entertainment.",
    properties: 65,
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
  },
  {
    id: 4,
    name: "Palm Jumeirah",
    description: "Experience exclusive island living on the world's most famous palm.",
    properties: 34,
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
  },
  {
    id: 5,
    name: "Downtown Dubai",
    description: "The heart of the city with the iconic Burj Khalifa and Dubai Mall.",
    properties: 89,
    image: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80",
  },
]

export function SignatureNeighborhoods() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % (NEIGHBORHOODS.length - 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + NEIGHBORHOODS.length - 1) % (NEIGHBORHOODS.length - 1))
  }

  const visibleNeighborhoods = [
    NEIGHBORHOODS[currentIndex],
    NEIGHBORHOODS[(currentIndex + 1) % NEIGHBORHOODS.length],
  ]

  return (
    <section className="py-20 lg:py-28 bg-[#0a0a0a] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="lg:sticky lg:top-32">
              {/* Header */}
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-px w-12 bg-[#C9A962]" />
                <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Communities</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
                Explore Signature<br />Neighborhoods
              </h2>
              
              <p className="text-white/60 mb-8 font-light leading-relaxed">
                Discover Dubai&apos;s most desirable communities, each offering a unique lifestyle, prime location, and modern living experience.
              </p>

              <Button className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none px-8 py-3 mb-12">
                Explore All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Map Illustration */}
              <div className="relative h-48 lg:h-64 border border-white/10 bg-white/5 overflow-hidden hidden lg:block">
                <svg viewBox="0 0 400 300" className="w-full h-full opacity-30">
                  <path d="M50,150 Q100,100 150,150 T250,150 T350,150" fill="none" stroke="#C9A962" strokeWidth="1" />
                  <path d="M100,100 Q150,50 200,100 T300,100" fill="none" stroke="#C9A962" strokeWidth="1" />
                  <path d="M80,200 Q130,150 180,200 T280,200" fill="none" stroke="#C9A962" strokeWidth="1" />
                  <circle cx="150" cy="120" r="4" fill="#C9A962" />
                  <circle cx="250" cy="150" r="4" fill="#C9A962" />
                  <circle cx="200" cy="180" r="4" fill="#C9A962" />
                </svg>
                
                {/* Navigation Dots */}
                <div className="absolute bottom-4 left-4 flex gap-3">
                  <button
                    onClick={prevSlide}
                    className="w-10 h-10 border border-white/30 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4 text-white/70" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 border border-white/30 flex items-center justify-center hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all"
                  >
                    <ChevronRight className="h-4 w-4 text-white/70" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Cards */}
          <div className="lg:col-span-8">
            <div className="grid md:grid-cols-2 gap-6">
              {visibleNeighborhoods.map((neighborhood, index) => (
                <div
                  key={neighborhood.id}
                  className={`group cursor-pointer ${index === 0 ? "md:row-span-1" : ""}`}
                >
                  <div className="relative h-[400px] md:h-[500px] overflow-hidden border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500">
                    <Image
                      src={neighborhood.image}
                      alt={neighborhood.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    
                    {/* Property Count Badge */}
                    <div className="absolute top-6 right-6">
                      <div className="bg-[#C9A962] px-4 py-2 text-black text-xs font-medium tracking-wider">
                        {neighborhood.properties} PROPERTIES
                      </div>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <h3 className="text-3xl font-light text-white mb-3 group-hover:text-[#C9A962] transition-colors">
                        {neighborhood.name}
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed mb-6">
                        {neighborhood.description}
                      </p>
                      
                      {/* Explore Link */}
                      <div className="flex items-center gap-2 text-[#C9A962] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-sm font-medium">Explore Community</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {NEIGHBORHOODS.slice(0, -1).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-[#C9A962]" 
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
