"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Building2, Calendar, MapPin } from "lucide-react"
import { Breadcrumbs } from "@/components/drenew/shared/breadcrumbs"
import { PropertyCard } from "@/components/drenew/shared/property-card"
import { InquiryForm } from "@/components/drenew/shared/inquiry-form"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { getDeveloperBySlug, DEVELOPERS } from "@/components/drenew/data/developers"
import { getPropertiesByDeveloper } from "@/components/drenew/data/properties"

interface DeveloperPageProps {
  params: Promise<{ slug: string }>
}

export default function DeveloperPage({ params }: DeveloperPageProps) {
  const { slug } = use(params)
  const developer = getDeveloperBySlug(slug)

  if (!developer) {
    notFound()
  }

  const properties = getPropertiesByDeveloper(slug)

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-[#0a0a0a] border-b border-white/10 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src={developer.image}
            alt={developer.name}
            fill
            className="object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Breadcrumbs
            items={[
              { label: "Developers", href: "/drenew/developers" },
              { label: developer.name },
            ]}
          />

          <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Logo */}
            <div className="w-24 h-24 lg:w-32 lg:h-32 border border-[#C9A962]/50 flex items-center justify-center bg-[#0a0a0a]">
              <span className="text-[#C9A962] text-4xl lg:text-5xl font-light">{developer.logo}</span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
                {developer.name}
              </h1>
              <p className="text-white/60 text-lg max-w-2xl">
                {developer.shortDescription}
              </p>

              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2 text-white/60">
                  <Building2 className="h-4 w-4 text-[#C9A962]" />
                  <span>{developer.projectCount} Projects</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="h-4 w-4 text-[#C9A962]" />
                  <span>Est. {developer.establishedYear}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="h-4 w-4 text-[#C9A962]" />
                  <span>{developer.headquarters}</span>
                </div>
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
                  About {developer.name}
                </h2>
                <p className="text-white/70 leading-relaxed">
                  {developer.description}
                </p>
              </div>

              {/* Stats */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">
                  Key Statistics
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {developer.stats.map((stat, index) => (
                    <div
                      key={index}
                      className="p-5 bg-white/5 border border-white/10 text-center"
                    >
                      <p className="text-2xl font-light text-[#C9A962] mb-1">
                        {stat.value}
                      </p>
                      <p className="text-white/50 text-sm">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communities */}
              <div>
                <h2 className="text-2xl font-light text-white mb-6">
                  Communities
                </h2>
                <div className="flex flex-wrap gap-3">
                  {developer.communities.map((community, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] text-sm"
                    >
                      {community}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-24">
                <InquiryForm
                  title={`Interested in ${developer.name} Projects?`}
                  subtitle="Get exclusive access to the latest launches and best deals."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Properties */}
      {properties.length > 0 && (
        <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light text-white">
                Projects by {developer.name}
              </h2>
              <span className="text-[#C9A962]">{properties.length} Projects</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.slug} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Developers */}
      <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-light text-white mb-8">
            Other Developer Partners
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEVELOPERS.filter((d) => d.slug !== slug)
              .slice(0, 4)
              .map((d) => (
                <a
                  key={d.slug}
                  href={`/drenew/developer/${d.slug}`}
                  className="p-6 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-all group"
                >
                  <div className="w-12 h-12 border border-[#C9A962]/50 flex items-center justify-center mb-4 group-hover:bg-[#C9A962]/10 transition-colors">
                    <span className="text-[#C9A962] text-xl">{d.logo}</span>
                  </div>
                  <h3 className="text-lg font-light text-white group-hover:text-[#C9A962] transition-colors">
                    {d.name}
                  </h3>
                  <p className="text-white/50 text-sm mt-1">{d.projectCount} Projects</p>
                </a>
              ))}
          </div>
        </div>
      </section>

      <CTABanner variant="gold" />
    </>
  )
}
