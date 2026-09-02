"use client"

import { useEffect, useState, useMemo } from "react"
import { PropertyCard } from "@/components/drecrypto"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Loader2, X } from "lucide-react"
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

export default function OffPlanPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [developer, setDeveloper] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("price-desc")

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    setLoading(true)
    try {
      const res = await fetch("/api/drecrypto/properties?type=off-plan&limit=100")
      if (res.ok) {
        const data = await res.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const developers = useMemo(() => {
    const devSet = new Set(properties.map(p => p.developer))
    return Array.from(devSet).filter(Boolean).sort()
  }, [properties])

  const filteredProperties = useMemo(() => {
    let result = [...properties]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      )
    }

    if (developer) {
      result = result.filter(p => p.developer === developer)
    }

    if (sortBy === "price-asc") result.sort((a, b) => a.priceBtc - b.priceBtc)
    else if (sortBy === "price-desc") result.sort((a, b) => b.priceBtc - a.priceBtc)
    else if (sortBy === "handover") result.sort((a, b) => {
      if (!a.handover) return 1
      if (!b.handover) return -1
      return new Date(a.handover).getTime() - new Date(b.handover).getTime()
    })

    return result
  }, [properties, searchQuery, developer, sortBy])

  const clearFilters = () => {
    setSearchQuery("")
    setDeveloper("")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 mb-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-500" />
            <span className="text-purple-400 text-sm font-medium uppercase tracking-wider">
              Future Investments
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Off-Plan Projects
          </h1>
          <p className="text-white/60 text-lg">
            Invest in Dubai&apos;s upcoming developments with flexible payment plans. 
            Pay your installments in Bitcoin, Ethereum, or USDT.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 mb-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-purple-500/10 border border-purple-500/30 p-6">
            <h3 className="text-white font-medium mb-2">Flexible Payments</h3>
            <p className="text-white/60 text-sm">Pay 10% booking, balance over construction period in crypto</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 p-6">
            <h3 className="text-white font-medium mb-2">Capital Appreciation</h3>
            <p className="text-white/60 text-sm">Benefit from value increase during construction</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 p-6">
            <h3 className="text-white font-medium mb-2">Top Developers</h3>
            <p className="text-white/60 text-sm">Projects from Emaar, DAMAC, Sobha, and more</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-4 md:p-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search off-plan projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white"
              />
            </div>

            <Select value={developer} onValueChange={setDeveloper}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Developer" />
              </SelectTrigger>
              <SelectContent>
                {developers.map((dev) => (
                  <SelectItem key={dev} value={dev}>
                    {dev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="handover">Handover Date</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || developer) && (
              <Button variant="ghost" onClick={clearFilters} className="text-white/60 hover:text-white">
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
            <span className="text-white">{filteredProperties.length}</span> off-plan projects
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} showContact />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No off-plan projects found</p>
          </div>
        )}
      </section>
    </div>
  )
}
