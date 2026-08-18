"use client"

import Image from "next/image"
import { Star, Quote } from "lucide-react"
import { TESTIMONIALS } from "./data"

export function Testimonials() {
  return (
    <section className="py-20 lg:py-32 bg-[#0a0a0a] border-t border-white/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Testimonials</span>
            <div className="h-px w-12 bg-[#C9A962]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
            Words That Build Trust
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            We take pride in creating smooth and rewarding real estate experiences across Dubai.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white/5 backdrop-blur-sm p-8 relative group hover:bg-white/10 border border-white/10 hover:border-[#C9A962]/50 transition-all duration-500"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-white/5 group-hover:text-[#C9A962]/20 transition-colors">
                <Quote className="h-12 w-12" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#C9A962] text-[#C9A962]"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/70 mb-8 leading-relaxed relative z-10 font-light">
                &quot;{testimonial.quote}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 overflow-hidden border border-white/20">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-white/50">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 border border-white/10 px-8 py-4">
            <div className="flex -space-x-2">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.id}
                  className="w-10 h-10 border-2 border-[#0a0a0a] overflow-hidden"
                >
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="h-8 w-px bg-white/20" />
            <span className="text-[#C9A962] font-medium">
              5000+ Happy Homeowners
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
