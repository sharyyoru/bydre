"use client"

import Image from "next/image"
import { Play, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FoundersSection() {
  return (
    <section className="py-20 lg:py-32 bg-[#0a0a0a] border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">
                Meet the Vision Behind DRE
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
              Built on relationships,<br />
              <span className="text-[#C9A962]">driven by results.</span>
            </h2>
            
            <p className="text-white/60 text-lg mb-8 font-light leading-relaxed max-w-lg">
              Founded on trust and expertise, DRE&apos;s founders are committed to helping clients 
              make confident real estate decisions through honest guidance and deep market knowledge.
            </p>

            {/* Founders Info */}
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="p-6 border border-white/10 bg-white/5">
                <h4 className="text-xl font-light text-white mb-1">Ahmad Hassan</h4>
                <p className="text-[#C9A962] text-sm mb-3">Co-Founder & CEO</p>
                <p className="text-white/50 text-sm leading-relaxed">
                  15+ years in UAE real estate, former Emaar executive with a vision for transparent property services.
                </p>
                <div className="flex gap-3 mt-4">
                  <a href="#" className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a href="#" className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors">
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="p-6 border border-white/10 bg-white/5">
                <h4 className="text-xl font-light text-white mb-1">Sarah Al-Rashid</h4>
                <p className="text-[#C9A962] text-sm mb-3">Co-Founder & COO</p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Expert in luxury property consulting with deep connections to Dubai&apos;s elite developers.
                </p>
                <div className="flex gap-3 mt-4">
                  <a href="#" className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a href="#" className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-[#C9A962] hover:text-[#C9A962] transition-colors">
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <Button className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none px-8 py-3">
              <Play className="mr-2 h-4 w-4" />
              Watch Our Story
            </Button>
          </div>

          {/* Right - Image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative">
              {/* Main Image */}
              <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden border border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80"
                  alt="DRE Founders"
                  fill
                  className="object-cover"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Gold Accent Frame */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border border-[#C9A962]/30 -z-10" />
              
              {/* Floating Stats */}
              <div className="absolute -left-6 bottom-20 bg-[#C9A962] p-6 shadow-xl hidden lg:block">
                <p className="text-4xl font-light text-black mb-1">10+</p>
                <p className="text-black/70 text-sm uppercase tracking-wider">Years Combined<br/>Experience</p>
              </div>

              {/* Quote Card */}
              <div className="absolute -right-6 top-12 max-w-[200px] bg-white/10 backdrop-blur-xl border border-white/20 p-4 hidden lg:block">
                <p className="text-white/80 text-sm italic leading-relaxed">
                  &quot;Our clients&apos; dreams are our mission.&quot;
                </p>
                <div className="mt-2 h-px w-8 bg-[#C9A962]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
