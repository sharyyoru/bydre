"use client"

import { useState, useMemo } from "react"
import { PageHero } from "@/components/drenew/shared/page-hero"
import { PropertyCard } from "@/components/drenew/shared/property-card"
import { FilterSidebar } from "@/components/drenew/shared/filter-sidebar"
import { Pagination } from "@/components/drenew/shared/pagination"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { PROPERTIES, getPropertiesByType } from "@/components/drenew/data/properties"
import { COMMUNITIES } from "@/components/drenew/data/communities"

const ITEMS_PER_PAGE = 12

export default function BuyPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})

  // Get all ready properties (for sale)
  const readyProperties = useMemo(() => getPropertiesByType("ready"), [])

  // Filter logic
  const filteredProperties = useMemo(() => {
    let result = [...readyProperties]

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

    // Filter by price range
    if (selectedFilters.price?.length) {
      result = result.filter((p) => {
        const priceRange = selectedFilters.price[0]
        if (priceRange === "0-2000000") return p.priceFrom < 2000000
        if (priceRange === "2000000-5000000") return p.priceFrom >= 2000000 && p.priceFrom < 5000000
        if (priceRange === "5000000-10000000") return p.priceFrom >= 5000000 && p.priceFrom < 10000000
        if (priceRange === "10000000+") return p.priceFrom >= 10000000
        return true
      })
    }

    return result
  }, [readyProperties, selectedFilters])

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE)
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Filter options
  const filters = [
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
    {
      id: "community",
      label: "Location",
      options: COMMUNITIES.slice(0, 8).map((c) => ({
        value: c.slug,
        label: c.name,
        count: readyProperties.filter((p) => p.communitySlug === c.slug).length,
      })),
      multiple: true,
    },
    {
      id: "beds",
      label: "Bedrooms",
      options: [
        { value: "1", label: "1 Bedroom" },
        { value: "2", label: "2 Bedrooms" },
        { value: "3", label: "3 Bedrooms" },
        { value: "4", label: "4 Bedrooms" },
        { value: "5", label: "5+ Bedrooms" },
      ],
      multiple: true,
    },
    {
      id: "price",
      label: "Price Range",
      options: [
        { value: "0-2000000", label: "Under AED 2M" },
        { value: "2000000-5000000", label: "AED 2M - 5M" },
        { value: "5000000-10000000", label: "AED 5M - 10M" },
        { value: "10000000+", label: "AED 10M+" },
      ],
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
        title="Buy Property"
        subtitle="Unlock unbeatable value with handpicked ready-to-move homes across Dubai's prime locations."
        count={filteredProperties.length}
        countLabel="Properties for Sale"
        breadcrumbs={[{ label: "Buy Property" }]}
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
                  <option value="size">Size: Largest First</option>
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
