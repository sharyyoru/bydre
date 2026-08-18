"use client"

import { useState, useMemo } from "react"
import { PageHero } from "@/components/drenew/shared/page-hero"
import { PropertyCard } from "@/components/drenew/shared/property-card"
import { FilterSidebar } from "@/components/drenew/shared/filter-sidebar"
import { Pagination } from "@/components/drenew/shared/pagination"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { getPropertiesByType } from "@/components/drenew/data/properties"
import { DEVELOPERS } from "@/components/drenew/data/developers"
import { COMMUNITIES } from "@/components/drenew/data/communities"

const ITEMS_PER_PAGE = 12

export default function OffPlanPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})

  // Get all off-plan properties
  const offPlanProperties = useMemo(() => getPropertiesByType("off-plan"), [])

  // Filter logic
  const filteredProperties = useMemo(() => {
    let result = [...offPlanProperties]

    // Filter by developer
    if (selectedFilters.developer?.length) {
      result = result.filter((p) =>
        selectedFilters.developer.includes(p.developerSlug)
      )
    }

    // Filter by community
    if (selectedFilters.community?.length) {
      result = result.filter((p) =>
        selectedFilters.community.includes(p.communitySlug)
      )
    }

    // Filter by beds
    if (selectedFilters.beds?.length) {
      result = result.filter((p) => {
        const beds = p.beds.toLowerCase()
        return selectedFilters.beds.some((b) => beds.includes(b.toLowerCase()))
      })
    }

    // Filter by category
    if (selectedFilters.category?.length) {
      result = result.filter((p) =>
        selectedFilters.category.includes(p.category)
      )
    }

    return result
  }, [offPlanProperties, selectedFilters])

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE)
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Filter options
  const filters = [
    {
      id: "developer",
      label: "Developer",
      options: DEVELOPERS.slice(0, 8).map((d) => ({
        value: d.slug,
        label: d.name,
        count: offPlanProperties.filter((p) => p.developerSlug === d.slug).length,
      })),
      multiple: true,
    },
    {
      id: "community",
      label: "Community",
      options: COMMUNITIES.slice(0, 8).map((c) => ({
        value: c.slug,
        label: c.name,
        count: offPlanProperties.filter((p) => p.communitySlug === c.slug).length,
      })),
      multiple: true,
    },
    {
      id: "beds",
      label: "Bedrooms",
      options: [
        { value: "studio", label: "Studio" },
        { value: "1", label: "1 Bedroom" },
        { value: "2", label: "2 Bedrooms" },
        { value: "3", label: "3 Bedrooms" },
        { value: "4", label: "4+ Bedrooms" },
      ],
      multiple: true,
    },
    {
      id: "category",
      label: "Property Type",
      options: [
        { value: "apartment", label: "Apartment" },
        { value: "villa", label: "Villa" },
        { value: "townhouse", label: "Townhouse" },
        { value: "penthouse", label: "Penthouse" },
      ],
      multiple: true,
    },
  ]

  const handleFilterChange = (filterId: string, values: string[]) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: values }))
    setCurrentPage(1)
  }

  const handleClearAll = () => {
    setSelectedFilters({})
    setCurrentPage(1)
  }

  return (
    <>
      <PageHero
        title="Off-Plan Properties"
        subtitle="Discover the newest and most sought-after projects fresh on the Dubai market. Invest early for maximum returns."
        count={filteredProperties.length}
        countLabel="Off-Plan Projects"
        breadcrumbs={[{ label: "Off-Plan Properties" }]}
      />

      <section className="py-12 lg:py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {/* Sidebar */}
            <FilterSidebar
              filters={filters}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
              resultCount={filteredProperties.length}
            />

            {/* Main Content */}
            <div className="flex-1">
              {/* Sort Bar */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <p className="text-white/60 text-sm">
                  Showing {paginatedProperties.length} of {filteredProperties.length} properties
                </p>
                <select className="bg-transparent border border-white/20 text-white/80 text-sm px-3 py-2 focus:border-[#C9A962] focus:outline-none">
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="handover">Handover Date</option>
                </select>
              </div>

              {/* Property Grid */}
              {paginatedProperties.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedProperties.map((property) => (
                    <PropertyCard
                      key={property.slug}
                      property={property}
                      showContact
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-white/60 text-lg">No properties match your filters.</p>
                  <button
                    onClick={handleClearAll}
                    className="mt-4 text-[#C9A962] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
