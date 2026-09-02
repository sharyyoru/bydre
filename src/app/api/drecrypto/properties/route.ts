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
const CACHE_DURATION = 300000 // 5 minutes

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

    // Check cache
    const now = Date.now()
    if (propertiesCache && (now - propertiesCache.timestamp) < CACHE_DURATION) {
      return filterAndReturn(propertiesCache.data, { type, minPriceBtc, maxPriceBtc, location, beds, limit, offset, propertyId })
    }

    // Get workspace ID by resolving slug to UUID
    const admin = createAdminClient()
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", "drehomes")
      .single()

    const workspaceId = workspace?.id
    if (!workspaceId) {
      console.error("Workspace 'drehomes' not found")
      return NextResponse.json({ 
        error: "Workspace not found",
        properties: [],
        total: 0
      })
    }

    // Fetch from GenieMap
    const projects = await fetchGenieMapProjects({ workspaceId })
    const prices = await getCryptoPrices()

    // Transform all projects
    const properties = projects
      .map(p => transformToProperty(p, prices))
      .filter((p): p is CryptoProperty => p !== null)
      .sort((a, b) => b.priceAed - a.priceAed)

    // Update cache
    propertiesCache = { data: properties, timestamp: now }

    return filterAndReturn(properties, { type, minPriceBtc, maxPriceBtc, location, beds, limit, offset, propertyId })
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
