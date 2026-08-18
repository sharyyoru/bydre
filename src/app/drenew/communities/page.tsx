"use client"

import { PageHero } from "@/components/drenew/shared/page-hero"
import { CommunityCard } from "@/components/drenew/shared/community-card"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { COMMUNITIES } from "@/components/drenew/data/communities"

export default function CommunitiesPage() {
  const featuredCommunities = COMMUNITIES.filter((c) => c.featured)
  const otherCommunities = COMMUNITIES.filter((c) => !c.featured)

  return (
    <>
      <PageHero
        title="Explore Dubai Communities"
        subtitle="Discover Dubai's most sought-after neighborhoods. From waterfront living to golf communities, find your perfect address."
        count={COMMUNITIES.length}
        countLabel="Communities"
        breadcrumbs={[{ label: "Communities" }]}
      />

      {/* Featured Communities */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">
              Featured Communities
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCommunities.map((community) => (
              <CommunityCard
                key={community.slug}
                community={community}
                size="large"
              />
            ))}
          </div>
        </div>
      </section>

      {/* All Communities */}
      <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">
              More Communities
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherCommunities.map((community) => (
              <CommunityCard key={community.slug} community={community} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-light text-[#C9A962] mb-2">
                {COMMUNITIES.length}+
              </p>
              <p className="text-white/60 uppercase tracking-wider text-sm">
                Communities
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-light text-[#C9A962] mb-2">
                1000+
              </p>
              <p className="text-white/60 uppercase tracking-wider text-sm">
                Properties
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-light text-[#C9A962] mb-2">
                50+
              </p>
              <p className="text-white/60 uppercase tracking-wider text-sm">
                Developers
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-light text-[#C9A962] mb-2">
                5000+
              </p>
              <p className="text-white/60 uppercase tracking-wider text-sm">
                Happy Clients
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
