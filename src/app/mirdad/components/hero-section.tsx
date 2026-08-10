"use client"

import { Download, ArrowRight, Zap, Building2, CreditCard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Project {
  starting_price_aed: number
  payment_plan: string
  ev_parking_percent: number
  amenities_count: number
}

interface HeroSectionProps {
  dict: {
    hero: {
      tagline: string
      headline: string
      subheadline: string
      cta: string
      secondaryCta: string
      stats: {
        startingPrice: string
        paymentPlan: string
        evCharging: string
        amenities: string
      }
    }
  }
  project: Project | null
}

export function HeroSection({ dict, project }: HeroSectionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-AE").format(price)
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Video/Image Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0a]" />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('/mirdad/hero-bg.jpg')",
            filter: "brightness(0.4)"
          }}
        />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A962] to-transparent" />

      <div className="container mx-auto px-4 py-20 lg:py-0 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm font-medium tracking-[0.2em] uppercase">
                {dict.hero.tagline}
              </span>
              <div className="h-px w-8 bg-[#C9A962]" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.1] tracking-tight">
              <span className="font-extralight">A New Era of</span>
              <br />
              <span className="font-semibold bg-gradient-to-r from-white via-[#C9A962] to-white bg-clip-text text-transparent">
                Refined Living
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              {dict.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <a href="#register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold min-h-[56px] px-10 text-base rounded-none"
                >
                  {dict.hero.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 min-h-[56px] px-10 text-base rounded-none backdrop-blur"
              >
                <Download className="mr-2 h-5 w-5" />
                {dict.hero.secondaryCta}
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-sm">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-[#C9A962]" />
                  <span className="text-xs text-white/50 uppercase tracking-wider">{dict.hero.stats.startingPrice}</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-white">
                  AED {project ? formatPrice(project.starting_price_aed) : "999,000"}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-[#C9A962]" />
                  <span className="text-xs text-white/50 uppercase tracking-wider">{dict.hero.stats.paymentPlan}</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-white">
                  {project?.payment_plan || "30/70"}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Zap className="h-4 w-4 text-[#C9A962]" />
                  <span className="text-xs text-white/50 uppercase tracking-wider">{dict.hero.stats.evCharging}</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-white">
                  {project?.ev_parking_percent || 50}%
                </p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-[#C9A962]" />
                  <span className="text-xs text-white/50 uppercase tracking-wider">{dict.hero.stats.amenities}</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-white">
                  {project?.amenities_count || 26}+
                </p>
              </div>
            </div>
          </div>

          {/* Right: Lead Form (Desktop) */}
          <div className="hidden lg:block">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-sm">
              <h3 className="text-2xl font-light text-white mb-2">Register Your Interest</h3>
              <p className="text-white/60 mb-6">Be the first to discover exclusive offerings</p>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A962] rounded-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A962] rounded-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A962] rounded-none"
                />
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/40 focus:outline-none focus:border-[#C9A962] rounded-none">
                  <option value="">I&apos;m interested in...</option>
                  <option value="studio">Studio</option>
                  <option value="1br">1 Bedroom</option>
                  <option value="2br">2 Bedrooms</option>
                  <option value="3br">3 Bedrooms</option>
                  <option value="loft">Loft</option>
                  <option value="duplex">Duplex</option>
                </select>
                <Button
                  type="submit"
                  className="w-full bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold py-4 text-base rounded-none"
                >
                  Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
              <p className="text-xs text-white/40 mt-4 text-center">
                By registering, you agree to our Privacy Policy
              </p>
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
