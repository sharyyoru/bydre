"use client"

import Image from "next/image"
import { ArrowRight, CheckCircle2, Shield, Globe, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"

const BENEFITS = [
  {
    icon: Shield,
    title: "10-Year Residency",
    description: "Long-term UAE residency for you and your family",
  },
  {
    icon: Globe,
    title: "No Sponsor Required",
    description: "Complete independence with self-sponsorship",
  },
  {
    icon: Briefcase,
    title: "Business Freedom",
    description: "100% ownership of mainland businesses",
  },
]

export function GoldenVisa() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">UAE Golden Visa</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
              Unlock Your Golden Visa<br />
              <span className="text-[#C9A962]">With DRE Homes</span>
            </h2>
            
            <p className="text-white/60 text-lg mb-10 font-light leading-relaxed max-w-lg">
              Invest in Dubai real estate and unlock exclusive Golden Visa benefits for a secure future, premium lifestyle, and long-term UAE residency.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-10">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 border border-[#C9A962]/50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A962]/10 transition-colors">
                    <benefit.icon className="h-5 w-5 text-[#C9A962]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">{benefit.title}</h4>
                    <p className="text-white/50 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Eligibility */}
            <div className="p-6 border border-white/10 bg-white/5 mb-10">
              <h4 className="text-sm text-[#C9A962] uppercase tracking-wider mb-4">Eligibility Requirements</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Property value AED 2M+",
                  "Clean criminal record",
                  "Valid health insurance",
                  "Property fully paid",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C9A962] flex-shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Button className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-medium rounded-none px-8 py-3">
                Get Golden Visa Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-none px-8 py-3">
                Learn More
              </Button>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative">
              {/* Main Passport Image */}
              <div className="relative z-10 flex justify-center">
                <div className="relative w-[280px] h-[380px] lg:w-[320px] lg:h-[440px]">
                  {/* Passport */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] to-[#0d1442] border border-white/20 shadow-2xl shadow-black/50 flex items-center justify-center">
                    {/* UAE Emblem */}
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-[#C9A962]/50 flex items-center justify-center">
                        <span className="text-[#C9A962] text-4xl">🦅</span>
                      </div>
                      <p className="text-[#C9A962] text-xs tracking-[0.3em] uppercase mb-2">الإمارات العربية المتحدة</p>
                      <p className="text-white/80 text-sm tracking-widest uppercase">UNITED ARAB EMIRATES</p>
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <p className="text-[#C9A962] text-xs tracking-[0.2em] uppercase">PASSPORT</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gold Accent Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C9A962] via-[#D4AF37] to-[#C9A962]" />
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -right-4 top-8 lg:-right-12 z-20">
                <div className="bg-[#C9A962] p-4 shadow-xl">
                  <p className="text-black text-xs uppercase tracking-wider mb-1">Golden Visa</p>
                  <p className="text-black font-semibold">10 Years</p>
                </div>
              </div>

              <div className="absolute -left-4 bottom-16 lg:-left-8 z-20">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-xl">
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Investment</p>
                  <p className="text-[#C9A962] font-semibold">AED 2M+</p>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#C9A962]/10 blur-[100px] rounded-full" />
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-8 right-8 w-32 h-40 border border-white/10 bg-white/5 -rotate-6 hidden lg:block">
                <div className="p-4">
                  <div className="w-full h-20 bg-gradient-to-br from-[#C9A962]/30 to-transparent mb-2" />
                  <div className="h-2 w-3/4 bg-white/20" />
                  <div className="h-2 w-1/2 bg-white/10 mt-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
