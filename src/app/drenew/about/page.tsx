"use client"

import Image from "next/image"
import { PageHero } from "@/components/drenew/shared/page-hero"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { CheckCircle2, Award, Users, Target, Eye, HeartHandshake } from "lucide-react"

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Core Value",
    description: "Taking care of our customers is something we do with a positive attitude and energy. We always succeed with hard work, smart thinking, and combined with teamwork and collaboration.",
  },
  {
    icon: Award,
    title: "Excellent Service",
    description: "We always go the extra mile to ensure that your home buying process is a pleasant experience. Offering exceptional real estate services not only in UAE but all over the world.",
  },
  {
    icon: Users,
    title: "Best Team",
    description: "With our experienced sales and marketing team, buying a home in UAE is not a dream for you. We feel proud that our skilled agents provide the best possible service by guiding you.",
  },
  {
    icon: Target,
    title: "Mission",
    description: "Our goal is to make a smooth journey and guide those who are interested in buying property in UAE. We want you to find the right home.",
  },
  {
    icon: Eye,
    title: "Vision",
    description: "The vision of our company is to maintain the highest quality of service that would establish its name as the world's leading real estate company.",
  },
  {
    icon: CheckCircle2,
    title: "Free Consultation",
    description: "Our main objective is to meet and exceed the expectations of our clients and get them the best property they want. We guide them properly and resolve all queries.",
  },
]

const STATS = [
  { label: "Years of Excellence", value: "10+" },
  { label: "Happy Homeowners", value: "5,000+" },
  { label: "Awards Received", value: "15+" },
  { label: "Expert Agents", value: "50+" },
]

const PARTNERS = [
  { name: "Emaar", logo: "E" },
  { name: "DAMAC", logo: "D" },
  { name: "Sobha", logo: "S" },
  { name: "Nakheel", logo: "N" },
  { name: "Aldar", logo: "A" },
  { name: "Meraas", logo: "M" },
  { name: "Danube", logo: "D" },
  { name: "Binghatti", logo: "B" },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About DRE Homes"
        subtitle="Experience. Excellence. Trust. We are Dubai's trusted real estate partner."
        breadcrumbs={[{ label: "About Us" }]}
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80"
      />

      {/* Intro Section */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-light text-white mb-6">
                Experience. Excellence. <span className="text-[#C9A962]">DRE.</span>
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                DRE Real Estate is an award-winning firm in Dubai, dedicated to helping clients 
                rent, sell, or buy luxury properties across Dubai and the UAE. From off-plan 
                projects to ready apartments, villas, townhouses, and penthouses — we provide 
                comprehensive real estate solutions.
              </p>
              <p className="text-white/70 leading-relaxed mb-6">
                Founded on trust and expertise, our founders are committed to helping clients 
                make confident real estate decisions through honest guidance and deep market knowledge.
              </p>
              <p className="text-white/70 leading-relaxed">
                We work directly with leading developers including Emaar Properties, Nakheel, 
                Danube, Meraas, Sobha Realty, and DAMAC Properties, providing exclusive access 
                to projects across Downtown, Palm Jumeirah, JVC, Dubai Hills, DAMAC Hills, and more.
              </p>
            </div>

            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] border border-white/10 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80"
                  alt="DRE Team"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-full border border-[#C9A962]/30 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* What Sets DRE Apart */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Our Values</span>
              <div className="h-px w-12 bg-[#C9A962]" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-light text-white mb-4">
              What Sets DRE Apart?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              It&apos;s not just what we do—it&apos;s how we do it that makes all the difference.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((value, index) => (
              <div
                key={index}
                className="p-8 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-all group"
              >
                <div className="w-14 h-14 border border-[#C9A962]/50 flex items-center justify-center mb-6 group-hover:bg-[#C9A962]/10 transition-colors">
                  <value.icon className="h-6 w-6 text-[#C9A962]" />
                </div>
                <h3 className="text-xl font-light text-white mb-3">{value.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-[#C9A962] via-[#D4AF37] to-[#C9A962]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl lg:text-5xl font-light text-black mb-2">
                  {stat.value}
                </p>
                <p className="text-black/70 uppercase tracking-wider text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Management Section */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light text-white mb-4">
              Meet Our Management
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Visionary leaders dedicated to excellence in real estate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-8 bg-white/5 border border-white/10">
              <div className="w-32 h-32 mx-auto mb-6 border border-[#C9A962]/50 rounded-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
                  alt="CEO"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-light text-white mb-1">Ahmad Hassan</h3>
              <p className="text-[#C9A962] text-sm mb-4">Co-Founder & CEO</p>
              <p className="text-white/50 text-sm">
                15+ years in UAE real estate, former Emaar executive with a vision for transparent property services.
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 border border-white/10">
              <div className="w-32 h-32 mx-auto mb-6 border border-[#C9A962]/50 rounded-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"
                  alt="COO"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-xl font-light text-white mb-1">Sarah Al-Rashid</h3>
              <p className="text-[#C9A962] text-sm mb-4">Co-Founder & COO</p>
              <p className="text-white/50 text-sm">
                Expert in luxury property consulting with deep connections to Dubai&apos;s elite developers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Partners */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-white mb-4">
              Our Developer Partners
            </h2>
            <p className="text-white/60">
              We work directly with Dubai&apos;s most prestigious developers.
            </p>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {PARTNERS.map((partner, index) => (
              <div
                key={index}
                className="aspect-square bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#C9A962]/50 transition-colors"
              >
                <span className="text-2xl text-[#C9A962] font-light">{partner.logo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
