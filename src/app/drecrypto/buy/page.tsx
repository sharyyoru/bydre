"use client"

import { useEffect, useState, useMemo } from "react"
import { PropertyCard } from "@/components/drecrypto"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Bitcoin, SlidersHorizontal, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Property {
  id: number
  name: string
  developer: string
  location: string
  type: "off-plan" | "ready"
  priceAed: number
  priceBtc: number
  priceUsdt: number
  beds: string
  sqft: string
  handover: string | null
  images: string[]
  status?: string | null
}

const BTC_PRICE_RANGES = [
  { value: "0-5", label: "Under 5 BTC" },
  { value: "5-15", label: "5 - 15 BTC" },
  { value: "15-30", label: "15 - 30 BTC" },
  { value: "30+", label: "30+ BTC" },
]

const LOCATIONS = [
  "Downtown Dubai",
  "Dubai Marina",
  "Palm Jumeirah",
  "Dubai Hills",
  "Business Bay",
  "JVC",
  "MBR City",
]

export default function BuyPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [propertyType, setPropertyType] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("price-desc")

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    setLoading(true)
    try {
      const res = await fetch("/api/drecrypto/properties?limit=100")
      if (res.ok) {
        const data = await res.json()
        setProperties(data.properties || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = useMemo(() => {
    let result = [...properties]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      )
    }

    // Price range in BTC
    if (priceRange) {
      if (priceRange === "0-5") result = result.filter(p => p.priceBtc < 5)
      else if (priceRange === "5-15") result = result.filter(p => p.priceBtc >= 5 && p.priceBtc < 15)
      else if (priceRange === "15-30") result = result.filter(p => p.priceBtc >= 15 && p.priceBtc < 30)
      else if (priceRange === "30+") result = result.filter(p => p.priceBtc >= 30)
    }

    // Location
    if (location) {
      result = result.filter(p => p.location.toLowerCase().includes(location.toLowerCase()))
    }

    // Type
    if (propertyType) {
      result = result.filter(p => p.type === propertyType)
    }

    // Sort
    if (sortBy === "price-asc") result.sort((a, b) => a.priceBtc - b.priceBtc)
    else if (sortBy === "price-desc") result.sort((a, b) => b.priceBtc - a.priceBtc)
    else if (sortBy === "newest") result.sort((a, b) => b.id - a.id)

    return result
  }, [properties, searchQuery, priceRange, location, propertyType, sortBy])

  const clearFilters = () => {
    setSearchQuery("")
    setPriceRange("")
    setLocation("")
    setPropertyType("")
  }

  const hasFilters = searchQuery || priceRange || location || propertyType

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 mb-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Bitcoin className="h-5 w-5 text-[#C9A962]" />
            <span className="text-[#C9A962] text-sm font-medium uppercase tracking-wider">
              Buy with Crypto
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Dubai Properties for Sale
          </h1>
          <p className="text-white/60 text-lg">
            Browse our collection of premium properties available for purchase with Bitcoin, Ethereum, and USDT.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-4 md:p-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white"
              />
            </div>

            {/* Price Range */}
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Price (BTC)" />
              </SelectTrigger>
              <SelectContent>
                {BTC_PRICE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location */}
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Property Type */}
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="off-plan">Off-Plan</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/60">
            Showing <span className="text-white">{filteredProperties.length}</span> of {total} properties
          </p>
          {hasFilters && (
            <div className="flex gap-2">
              {searchQuery && (
                <Badge variant="outline" className="border-white/20 text-white/80">
                  Search: {searchQuery}
                </Badge>
              )}
              {priceRange && (
                <Badge variant="outline" className="border-white/20 text-white/80">
                  {BTC_PRICE_RANGES.find(r => r.value === priceRange)?.label}
                </Badge>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#C9A962] animate-spin" />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} showContact />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <SlidersHorizontal className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg mb-4">No properties match your filters</p>
            <Button onClick={clearFilters} variant="outline" className="border-white/20 text-white">
              Clear Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
