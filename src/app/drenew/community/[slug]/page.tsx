"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { MapPin, Home, TrendingUp, Clock } from "lucide-react"
import { Breadcrumbs } from "@/components/drenew/shared/breadcrumbs"
import { PropertyCard } from "@/components/drenew/shared/property-card"
import { InquiryForm } from "@/components/drenew/shared/inquiry-form"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { getCommunityBySlug, COMMUNITIES } from "@/components/drenew/data/communities"
import { getPropertiesByCommunity } from "@/components/drenew/data/properties"

interface CommunityPageProps {
  params: Promise<{ slug: string }>
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = use(params)
  const community = getCommunityBySlug(slug)

  if (!community) {
    notFound()
  }

  const properties = getPropertiesByCommunity(slug)

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src={community.image}
          alt={community.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <Breadcrumbs
              items={[
                { label: "Communities", href: "/drenew/communities" },
                { label: community.name },
              ]}
            />

            <h1 className="text-4xl lg:text-5xl font-light text-white mt-6">
              {community.name}
            </h1>

            <p className="text-white/70 text-lg mt-4 max-w-2xl">
              {community.shortDescription}
            </p>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-[#C9A962]">
                <Home className="h-5 w-5" />
                <span className="font-medium">{community.propertyCount} Properties</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <TrendingUp className="h-5 w-5" />
                <span>ROI: {community.highlights.find(h => h.label === "ROI")?.value || "5-7%"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* About */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">
                  Why Live in {community.name}?
                </h2>
                <p className="text-white/70 leading-relaxed">
                  {community.description}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">
                  Key Highlights
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {community.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="p-5 bg-white/5 border border-white/10 text-center"
                    >
                      <p className="text-2xl font-light text-[#C9A962] mb-1">
                        {highlight.value}
                      </p>
                      <p className="text-white/50 text-sm">{highlight.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Attractions */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">
                  Minutes Away From Dubai&apos;s Top Attractions
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {community.nearbyAttractions.map((attraction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[#C9A962]" />
                        <span className="text-white/80">{attraction.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/50">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{attraction.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Types */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">
                  Available Property Types
                </h2>
                <div className="flex flex-wrap gap-3">
                  {community.propertyTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="p-6 bg-gradient-to-r from-[#C9A962]/20 to-transparent border-l-4 border-[#C9A962]">
                <p className="text-white/60 text-sm mb-1">Price Range</p>
                <p className="text-2xl font-light text-white">
                  AED {(community.priceRange.min / 1000000).toFixed(1)}M - {(community.priceRange.max / 1000000).toFixed(0)}M+
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-24">
                <InquiryForm
                  title={`Interested in ${community.name}?`}
                  subtitle="Get expert guidance on the best properties in this community."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties in Community */}
      {properties.length > 0 && (
        <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light text-white">
                Exclusive Homes in {community.name}
              </h2>
              <span className="text-[#C9A962]">{properties.length} Properties</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.slice(0, 8).map((property) => (
                <PropertyCard key={property.slug} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Communities */}
      <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-light text-white mb-8">
            Explore Other Communities
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMUNITIES.filter((c) => c.slug !== slug)
              .slice(0, 4)
              .map((c) => (
                <div
                  key={c.slug}
                  className="relative h-[200px] overflow-hidden border border-white/10 group"
                >
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <a
                    href={`/drenew/community/${c.slug}`}
                    className="absolute inset-0 flex items-end p-4"
                  >
                    <div>
                      <h3 className="text-lg font-light text-white group-hover:text-[#C9A962] transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-white/50 text-sm">{c.propertyCount} Properties</p>
                    </div>
                  </a>
                </div>
              ))}
          </div>
        </div>
      </section>

      <CTABanner variant="gold" />
    </>
  )
}
