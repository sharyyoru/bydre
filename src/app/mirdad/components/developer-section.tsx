import { Building2, Users, Award, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeveloperSectionProps {
  dict: {
    developer: {
      title: string
      subtitle: string
      description: string
      stats: {
        years: string
        projects: string
        employees: string
      }
    }
  }
}

export function DeveloperSection({ dict }: DeveloperSectionProps) {
  return (
    <section id="developer" className="py-20 lg:py-32 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">The Developer</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
              {dict.developer.title}
            </h2>

            <p className="text-xl text-[#C9A962] font-light mb-6">
              {dict.developer.subtitle}
            </p>

            <p className="text-white/60 leading-relaxed mb-8">
              {dict.developer.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 border border-white/10">
                <Award className="w-6 h-6 text-[#C9A962] mx-auto mb-2" />
                <p className="text-3xl font-light text-white">37+</p>
                <p className="text-xs text-white/50 uppercase">{dict.developer.stats.years}</p>
              </div>
              <div className="text-center p-4 border border-white/10">
                <Building2 className="w-6 h-6 text-[#C9A962] mx-auto mb-2" />
                <p className="text-3xl font-light text-white">50+</p>
                <p className="text-xs text-white/50 uppercase">{dict.developer.stats.projects}</p>
              </div>
              <div className="text-center p-4 border border-white/10">
                <Users className="w-6 h-6 text-[#C9A962] mx-auto mb-2" />
                <p className="text-3xl font-light text-white">10K+</p>
                <p className="text-xs text-white/50 uppercase">{dict.developer.stats.employees}</p>
              </div>
            </div>

            <a href="#register">
              <Button className="bg-[#C9A962] hover:bg-[#B8985A] text-black font-semibold px-8 py-4 rounded-none">
                Get in Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Right: Image/Logo */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto">
              {/* Logo Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-6 border-2 border-[#C9A962]/30 rounded-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-[#C9A962]">UP</span>
                  </div>
                  <p className="text-2xl font-light text-white">Union Properties</p>
                  <p className="text-white/50 text-sm mt-2">PJSC</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-[#C9A962]/20" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-[#C9A962]/20" />
            </div>

            {/* Landmark badges */}
            <div className="absolute top-1/4 -left-4 bg-white/5 backdrop-blur border border-white/10 px-4 py-2">
              <p className="text-xs text-white/50">Landmark</p>
              <p className="text-sm text-white font-medium">Motor City</p>
            </div>
            <div className="absolute bottom-1/4 -right-4 bg-white/5 backdrop-blur border border-white/10 px-4 py-2">
              <p className="text-xs text-white/50">Landmark</p>
              <p className="text-sm text-white font-medium">Index Tower</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
