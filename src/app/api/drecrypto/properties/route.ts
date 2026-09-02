import { NextRequest, NextResponse } from "next/server"
import { fetchGenieMapProjects, GenieMapProjectInput } from "@/lib/social-monitor/geniemap"
import { createAdminClient } from "@/lib/supabase/admin"

export interface CryptoProperty {
  id: number
  name: string
  developer: string
  location: string
  status: "available" | "sold_out" | "launch" | null
  type: "off-plan" | "ready"
  priceAed: number
  priceAedMax?: number
  priceBtc: number
  priceEth: number
  priceUsdt: number
  beds: string
  baths: string
  sqft: string
  handover: string | null
  description: string | null
  images: string[]
  amenities: string[]
  latitude: number | null
  longitude: number | null
}

interface CachEntry {
  data: CryptoProperty[]
  timestamp: number
}

let propertiesCache: CachEntry | null = null
const CACHE_DURATION = 600000 // 10 minutes
const STALE_DURATION = 1800000 // 30 minutes (serve stale while refreshing)
let isRefreshing = false

// Static fallback properties with real Dubai images
const FALLBACK_PROPERTIES: CryptoProperty[] = [
  {
    id: 999001,
    name: "Burj Vista Residences",
    developer: "Emaar Properties",
    location: "Downtown Dubai",
    status: "available",
    type: "off-plan",
    priceAed: 2850000,
    priceBtc: 8.14,
    priceEth: 219.23,
    priceUsdt: 776566,
    beds: "1-3 BR",
    baths: "2+",
    sqft: "750 - 2,200",
    handover: "2026-12",
    description: "Luxury residences with stunning Burj Khalifa views",
    images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80"],
    amenities: ["Pool", "Gym", "Concierge", "Parking"],
    latitude: 25.1972,
    longitude: 55.2744
  },
  {
    id: 999002,
    name: "Marina Pearl Tower",
    developer: "DAMAC Properties",
    location: "Dubai Marina",
    status: "available",
    type: "ready",
    priceAed: 1950000,
    priceBtc: 5.57,
    priceEth: 150.0,
    priceUsdt: 531335,
    beds: "Studio - 2 BR",
    baths: "1-2",
    sqft: "450 - 1,400",
    handover: null,
    description: "Waterfront living in the heart of Dubai Marina",
    images: ["https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80"],
    amenities: ["Beach Access", "Marina View", "Gym", "Pool"],
    latitude: 25.0805,
    longitude: 55.1403
  },
  {
    id: 999003,
    name: "Palm Signature Villas",
    developer: "Nakheel",
    location: "Palm Jumeirah",
    status: "available",
    type: "ready",
    priceAed: 15500000,
    priceBtc: 44.29,
    priceEth: 1192.31,
    priceUsdt: 4223433,
    beds: "5-7 BR",
    baths: "6+",
    sqft: "8,000 - 15,000",
    handover: null,
    description: "Exclusive beachfront villas on Palm Jumeirah",
    images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80"],
    amenities: ["Private Beach", "Pool", "Garden", "Smart Home"],
    latitude: 25.1124,
    longitude: 55.1390
  },
  {
    id: 999004,
    name: "Business Bay Executive Tower",
    developer: "Sobha Realty",
    location: "Business Bay",
    status: "available",
    type: "off-plan",
    priceAed: 1750000,
    priceBtc: 5.0,
    priceEth: 134.62,
    priceUsdt: 476839,
    beds: "1-2 BR",
    baths: "1-2",
    sqft: "650 - 1,200",
    handover: "2025-09",
    description: "Modern apartments in Dubai's business district",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
    amenities: ["Gym", "Pool", "Business Center", "Parking"],
    latitude: 25.1850,
    longitude: 55.2650
  },
  {
    id: 999005,
    name: "JBR Beach Residence",
    developer: "Meraas",
    location: "Jumeirah Beach Residence",
    status: "available",
    type: "ready",
    priceAed: 3200000,
    priceBtc: 9.14,
    priceEth: 246.15,
    priceUsdt: 871935,
    beds: "2-3 BR",
    baths: "2-3",
    sqft: "1,200 - 2,500",
    handover: null,
    description: "Beachfront apartments with panoramic sea views",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
    amenities: ["Beach Access", "Pool", "Gym", "Kids Area"],
    latitude: 25.0785,
    longitude: 55.1338
  },
  {
    id: 999006,
    name: "Dubai Hills Estate Villa",
    developer: "Emaar Properties",
    location: "Dubai Hills Estate",
    status: "available",
    type: "off-plan",
    priceAed: 8500000,
    priceBtc: 24.29,
    priceEth: 653.85,
    priceUsdt: 2316076,
    beds: "4-6 BR",
    baths: "5+",
    sqft: "4,500 - 8,000",
    handover: "2026-06",
    description: "Premium villas overlooking Dubai Hills Golf Course",
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"],
    amenities: ["Golf Course View", "Pool", "Garden", "Maid Room"],
    latitude: 25.1034,
    longitude: 55.2378
  }
]

async function getCryptoPrices(): Promise<{ btc: number; eth: number; usdt: number }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/drecrypto/prices`)
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }
  return { btc: 350000, eth: 13000, usdt: 3.67 }
}

function transformToProperty(project: GenieMapProjectInput, prices: { btc: number; eth: number; usdt: number }): CryptoProperty | null {
  const priceAed = project.price_min || 0
  if (priceAed === 0) return null

  const isOffPlan = project.status === "launch" || (project.handover_date && new Date(project.handover_date) > new Date())
  
  // Calculate beds range from unit_types
  let beds = "Studio"
  if (project.unit_types && project.unit_types.length > 0) {
    const bedCounts = project.unit_types.map(u => u.beds).filter(b => b >= 0)
    if (bedCounts.length > 0) {
      const minBeds = Math.min(...bedCounts)
      const maxBeds = Math.max(...bedCounts)
      beds = minBeds === maxBeds 
        ? (minBeds === 0 ? "Studio" : `${minBeds} BR`)
        : `${minBeds === 0 ? "Studio" : minBeds} - ${maxBeds} BR`
    }
  }
  
  // Calculate sqft range
  let sqft = "N/A"
  if (project.area_min) {
    sqft = project.area_max && project.area_max !== project.area_min
      ? `${Math.round(project.area_min).toLocaleString()} - ${Math.round(project.area_max).toLocaleString()}`
      : `${Math.round(project.area_min).toLocaleString()}`
  }

  return {
    id: project.external_id,
    name: project.name,
    developer: project.developer_name || "Developer",
    location: project.district_name || "Dubai",
    status: project.status,
    type: isOffPlan ? "off-plan" : "ready",
    priceAed: priceAed,
    priceAedMax: project.price_max || undefined,
    priceBtc: parseFloat((priceAed / prices.btc).toFixed(4)),
    priceEth: parseFloat((priceAed / prices.eth).toFixed(2)),
    priceUsdt: parseFloat((priceAed / prices.usdt).toFixed(0)),
    beds,
    baths: "1+",
    sqft,
    handover: project.handover_date,
    description: project.description,
    images: project.images.length > 0 ? project.images : [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
    ],
    amenities: project.amenities,
    latitude: project.latitude,
    longitude: project.longitude
  }
}

async function refreshCache(): Promise<CryptoProperty[]> {
  try {
    const admin = createAdminClient()
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", "drehomes")
      .single()

    const workspaceId = workspace?.id
    if (!workspaceId) {
      console.error("Workspace 'drehomes' not found")
      return []
    }

    const projects = await fetchGenieMapProjects({ workspaceId })
    const prices = await getCryptoPrices()

    const properties = projects
      .map(p => transformToProperty(p, prices))
      .filter((p): p is CryptoProperty => p !== null)
      .sort((a, b) => b.priceAed - a.priceAed)

    // Update cache
    propertiesCache = { data: properties, timestamp: Date.now() }
    console.log(`Cache refreshed with ${properties.length} properties`)
    
    return properties
  } catch (error) {
    console.error("Error refreshing cache:", error)
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "off-plan" | "ready" | null (all)
    const minPriceBtc = searchParams.get("minPriceBtc")
    const maxPriceBtc = searchParams.get("maxPriceBtc")
    const location = searchParams.get("location")
    const beds = searchParams.get("beds")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const propertyId = searchParams.get("id")

    // Check cache - stale-while-revalidate pattern
    const now = Date.now()
    const cacheAge = propertiesCache ? now - propertiesCache.timestamp : Infinity
    
    // Fresh cache - return immediately
    if (propertiesCache && cacheAge < CACHE_DURATION) {
      const response = filterAndReturn(propertiesCache.data, { type, minPriceBtc, maxPriceBtc, location, beds, limit, offset, propertyId })
      response.headers.set("X-Cache-Status", "HIT")
      return response
    }
    
    // Stale cache - return stale and refresh in background
    if (propertiesCache && cacheAge < STALE_DURATION && !isRefreshing) {
      // Trigger background refresh
      isRefreshing = true
      refreshCache().finally(() => { isRefreshing = false })
      
      const response = filterAndReturn(propertiesCache.data, { type, minPriceBtc, maxPriceBtc, location, beds, limit, offset, propertyId })
      response.headers.set("X-Cache-Status", "STALE")
      return response
    }
    
    // No cache or very stale - return fallback immediately, fetch in background
    if (!isRefreshing) {
      isRefreshing = true
      refreshCache().finally(() => { isRefreshing = false })
    }
    
    // Use old cache if available, otherwise use static fallback
    const dataToUse = propertiesCache?.data || FALLBACK_PROPERTIES
    const response = filterAndReturn(dataToUse, { type, minPriceBtc, maxPriceBtc, location, beds, limit, offset, propertyId })
    response.headers.set("X-Cache-Status", propertiesCache ? "REVALIDATING" : "FALLBACK")
    return response
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json({ 
      error: "Failed to fetch properties",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function filterAndReturn(
  properties: CryptoProperty[],
  filters: {
    type: string | null
    minPriceBtc: string | null
    maxPriceBtc: string | null
    location: string | null
    beds: string | null
    limit: number
    offset: number
    propertyId: string | null
  }
) {
  let filtered = [...properties]

  // Single property lookup
  if (filters.propertyId) {
    const property = filtered.find(p => p.id === parseInt(filters.propertyId!))
    if (property) {
      return NextResponse.json({ property })
    }
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }

  // Filter by type
  if (filters.type) {
    filtered = filtered.filter(p => p.type === filters.type)
  }

  // Filter by price in BTC
  if (filters.minPriceBtc) {
    const min = parseFloat(filters.minPriceBtc)
    filtered = filtered.filter(p => p.priceBtc >= min)
  }
  if (filters.maxPriceBtc) {
    const max = parseFloat(filters.maxPriceBtc)
    filtered = filtered.filter(p => p.priceBtc <= max)
  }

  // Filter by location
  if (filters.location) {
    const loc = filters.location.toLowerCase()
    filtered = filtered.filter(p => p.location.toLowerCase().includes(loc))
  }

  // Filter by beds
  if (filters.beds) {
    filtered = filtered.filter(p => p.beds.includes(filters.beds!))
  }

  // Pagination
  const total = filtered.length
  const paginated = filtered.slice(filters.offset, filters.offset + filters.limit)

  return NextResponse.json({
    properties: paginated,
    total,
    limit: filters.limit,
    offset: filters.offset
  })
}
