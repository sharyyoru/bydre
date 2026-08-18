"use client"

import { PageHero } from "@/components/drenew/shared/page-hero"
import { DeveloperCard } from "@/components/drenew/shared/developer-card"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { DEVELOPERS } from "@/components/drenew/data/developers"

export default function DevelopersPage() {
  const featuredDevelopers = DEVELOPERS.filter((d) => d.featured)
  const otherDevelopers = DEVELOPERS.filter((d) => !d.featured)

  const totalProjects = DEVELOPERS.reduce((sum, d) => sum + d.projectCount, 0)

  return (
    <>
      <PageHero
        title="Our Developer Partners"
        subtitle="We work directly with Dubai's most prestigious developers to bring you exclusive access to premium properties."
        count={totalProjects}
        countLabel="Total Projects"
        breadcrumbs={[{ label: "Developers" }]}
      />

      {/* Featured Developers */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">
              Featured Partners
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDevelopers.map((developer) => (
              <DeveloperCard key={developer.slug} developer={developer} />
            ))}
          </div>
        </div>
      </section>

      {/* All Developers */}
      <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">
              All Developers
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherDevelopers.map((developer) => (
              <DeveloperCard key={developer.slug} developer={developer} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-white mb-4">
              Why Developers Choose DRE
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              We are the trusted sales partner for Dubai&apos;s leading developers, 
              delivering results through expertise, integrity, and dedication.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/5 border border-white/10">
              <div className="w-16 h-16 border border-[#C9A962]/50 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-[#C9A962]">💎</span>
              </div>
              <h3 className="text-xl font-light text-white mb-3">Exclusive Access</h3>
              <p className="text-white/50">
                First access to new launches and exclusive inventory allocations from top developers.
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 border border-white/10">
              <div className="w-16 h-16 border border-[#C9A962]/50 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-[#C9A962]">🏆</span>
              </div>
              <h3 className="text-xl font-light text-white mb-3">Award-Winning Service</h3>
              <p className="text-white/50">
                Recognized excellence in real estate services with multiple industry awards.
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 border border-white/10">
              <div className="w-16 h-16 border border-[#C9A962]/50 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-[#C9A962]">🤝</span>
              </div>
              <h3 className="text-xl font-light text-white mb-3">Trusted Partnership</h3>
              <p className="text-white/50">
                Long-term relationships built on trust, transparency, and consistent results.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
