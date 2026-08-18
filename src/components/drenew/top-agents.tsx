"use client"

import { useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Star, Phone, Mail, Award, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

const TOP_AGENTS = [
  {
    id: 1,
    name: "Mohammed Al-Farsi",
    title: "Senior Property Consultant",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    deals: 156,
    volume: "AED 450M+",
    rating: 4.9,
    reviews: 89,
    specialization: "Luxury Villas",
    badge: "Top Performer",
  },
  {
    id: 2,
    name: "Fatima Hassan",
    title: "Investment Specialist",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    deals: 142,
    volume: "AED 380M+",
    rating: 4.8,
    reviews: 76,
    specialization: "Off-Plan Projects",
    badge: "Rising Star",
  },
  {
    id: 3,
    name: "Omar Khalid",
    title: "Commercial Expert",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    deals: 128,
    volume: "AED 520M+",
    rating: 4.9,
    reviews: 94,
    specialization: "Commercial Properties",
    badge: "Top Performer",
  },
  {
    id: 4,
    name: "Aisha Rahman",
    title: "Residential Specialist",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    deals: 118,
    volume: "AED 290M+",
    rating: 4.7,
    reviews: 68,
    specialization: "Apartments & Penthouses",
  },
  {
    id: 5,
    name: "Rashid Al-Maktoum",
    title: "Luxury Portfolio Manager",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    deals: 98,
    volume: "AED 680M+",
    rating: 5.0,
    reviews: 52,
    specialization: "Ultra-Luxury Estates",
    badge: "Elite Agent",
  },
]

export function TopAgents() {
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
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Our Team</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
              Meet Our Top Performers
            </h2>
            <p className="text-white/60 max-w-xl font-light">
              Award-winning agents dedicated to delivering exceptional results and personalized service for every client.
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-6 lg:mt-0">
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

        {/* Agents Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TOP_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex-shrink-0 w-[300px] lg:w-[320px] snap-start group"
            >
              <div className="relative border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500 bg-gradient-to-b from-white/5 to-transparent">
                {/* Image */}
                <div className="relative h-[280px] overflow-hidden">
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  
                  {/* Badge */}
                  {agent.badge && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-1.5 bg-[#C9A962] px-3 py-1.5 text-black text-xs font-medium">
                        <Award className="h-3 w-3" />
                        {agent.badge}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-1">
                    <Star className="h-3 w-3 fill-[#C9A962] text-[#C9A962]" />
                    <span className="text-white text-xs font-medium">{agent.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-light text-white mb-1 group-hover:text-[#C9A962] transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-[#C9A962] text-sm mb-4">{agent.title}</p>
                  
                  {/* Specialization */}
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-4">
                    Specializes in {agent.specialization}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 border border-white/10 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-[#C9A962]" />
                        <span className="text-lg font-semibold text-white">{agent.deals}</span>
                      </div>
                      <p className="text-[10px] text-white/50 uppercase">Closed Deals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white mb-1">{agent.volume}</p>
                      <p className="text-[10px] text-white/50 uppercase">Sales Volume</p>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 border-white/20 text-white hover:bg-white/10 hover:border-[#C9A962] rounded-none text-xs">
                      <Phone className="h-3 w-3 mr-1.5" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 border-white/20 text-white hover:bg-white/10 hover:border-[#C9A962] rounded-none text-xs">
                      <Mail className="h-3 w-3 mr-1.5" />
                      Email
                    </Button>
                  </div>
                </div>

                {/* Hover Line */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C9A962] group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-none px-8 py-3">
            View All Agents
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
