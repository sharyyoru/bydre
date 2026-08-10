import { ArrowRight, Cog } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  dict: {
    hero: {
      badge: string
      headline: string
      subheadline: string
      cta: string
      secondaryCta: string
    }
  }
}

export function HeroSection({ dict }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('/mirdad/grid-pattern.svg')] opacity-5" />

      <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
              <Cog className="h-4 w-4 text-amber-400 animate-spin-slow" />
              <span className="text-sm text-amber-400 font-medium">
                {dict.hero.badge}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {dict.hero.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0">
              {dict.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#collection">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold min-h-[48px] px-8"
                >
                  {dict.hero.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="#faq">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white min-h-[48px] px-8"
                >
                  {dict.hero.secondaryCta}
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-800">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">50+</p>
                <p className="text-xs sm:text-sm text-slate-500">Models</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">10K+</p>
                <p className="text-xs sm:text-sm text-slate-500">Builders</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">4.9★</p>
                <p className="text-xs sm:text-sm text-slate-500">Rating</p>
              </div>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative">
            <div className="aspect-square max-w-lg mx-auto rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Cog className="w-16 h-16 text-amber-500/50" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    Hero Image Placeholder
                    <br />
                    <span className="text-xs">1200 × 1200px recommended</span>
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-amber-500/5 blur-xl" />
              <div className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl" />
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 sm:top-4 sm:right-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-slate-400">Starting from</p>
              <p className="text-lg font-bold text-amber-500">AED 349</p>
            </div>
            <div className="absolute -bottom-4 -left-4 sm:bottom-8 sm:left-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-slate-400">Up to</p>
              <p className="text-lg font-bold text-white">3,500+ pieces</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
