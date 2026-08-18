"use client"

import Image from "next/image"
import { Breadcrumbs, BreadcrumbItem } from "./breadcrumbs"

interface PageHeroProps {
  title: string
  subtitle?: string
  count?: number
  countLabel?: string
  breadcrumbs: BreadcrumbItem[]
  backgroundImage?: string
  compact?: boolean
}

export function PageHero({
  title,
  subtitle,
  count,
  countLabel = "Properties",
  breadcrumbs,
  backgroundImage,
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={`relative ${compact ? "py-16 lg:py-20" : "py-20 lg:py-28"} bg-[#0a0a0a] border-b border-white/10 overflow-hidden`}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]" />
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A962]/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A962]/5 blur-[80px] rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Title Section */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-[#C9A962]" />
              <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">
                DRE Homes
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-4 text-white/60 max-w-2xl font-light text-lg">
                {subtitle}
              </p>
            )}
          </div>

          {/* Count Badge */}
          {count !== undefined && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl lg:text-4xl font-light text-[#C9A962]">
                  {count.toLocaleString()}
                </p>
                <p className="text-white/50 text-sm uppercase tracking-wider">
                  {countLabel}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
