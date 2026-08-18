"use client"

import Image from "next/image"
import { Play, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DEVELOPERS, STATS } from "./data"

export function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-32 bg-[#0a0a0a] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image/Video */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                alt="DRE Homes Office"
                fill
                className="object-cover"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button className="w-20 h-20 border border-white/30 flex items-center justify-center hover:bg-[#C9A962] hover:border-[#C9A962] transition-all group">
                  <Play className="h-8 w-8 text-white ml-1 group-hover:text-black" />
                </button>
              </div>
            </div>
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -right-6 bg-[#C9A962] p-6 hidden md:block">
              <p className="text-3xl font-bold text-black">10+</p>
              <p className="text-black/70 text-sm uppercase tracking-wider">Years of Excellence</p>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">About DRE Homes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6">
              Elevating Real Estate with Trust and Excellence
            </h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed font-light">
              Founded on trust and expertise, DRE Homes is committed to helping clients make 
              confident real estate decisions through honest guidance and deep market knowledge. 
              We connect you to Dubai&apos;s premium properties through trusted expertise and 
              personalized solutions.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-10">
              {[
                "Direct partnerships with top Dubai developers",
                "Personalized property matching based on your needs",
                "End-to-end support from viewing to handover",
                "Expert market insights and investment guidance",
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#C9A962] flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold rounded-none px-8">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-none px-8">
                <Play className="mr-2 h-4 w-4" />
                Watch Our Story
              </Button>
            </div>
          </div>
        </div>

        {/* Developer Partners */}
        <div className="mt-24 pt-20 border-t border-white/5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Strong Partnerships</span>
              <div className="h-px w-12 bg-[#C9A962]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-light text-white">
              Backed by Trusted Developers
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {DEVELOPERS.map((developer) => (
              <div
                key={developer.name}
                className="group p-6 text-center border border-white/10 hover:border-[#C9A962]/50 transition-all cursor-pointer bg-white/5 backdrop-blur-sm"
              >
                <div className="w-12 h-12 mx-auto mb-3 border border-white/20 flex items-center justify-center group-hover:border-[#C9A962] group-hover:text-[#C9A962] transition-colors">
                  <span className="text-lg font-bold text-white/70 group-hover:text-[#C9A962]">
                    {developer.logo}
                  </span>
                </div>
                <h4 className="font-medium text-white text-sm mb-1">
                  {developer.name}
                </h4>
                <p className="text-xs text-white/40">
                  {developer.count} Properties
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
