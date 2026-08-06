import { getCredential } from "./credentials"
import { NotConfiguredError } from "./types"

export interface GenieMapUnitType {
  type: string
  layout: string
  beds: number
  baths: number
  area: number
  price: number
}

export interface GenieMapProjectInput {
  workspace_id: string
  external_id: number
  name: string
  developer_name: string | null
  developer_id: number | null
  district_name: string | null
  district_id: number | null
  status: "available" | "sold_out" | "launch" | null
  price_min: number | null
  price_max: number | null
  price_per_sqft: number | null
  area_min: number | null
  area_max: number | null
  handover_date: string | null
  service_charge: number | null
  eoi_amount: number | null
  unit_types: GenieMapUnitType[]
  latitude: number | null
  longitude: number | null
  image_url: string | null
  images: string[]
  documents: string[]
  description: string | null
  amenities: string[]
  payment_plans: Record<string, unknown>[]
  raw: Record<string, unknown>
}

export interface FetchProjectsParams {
  workspaceId: string
  filters?: {
    districtId?: number
    developerId?: number
    minPrice?: number
    maxPrice?: number
    minPricePerSqFt?: number
    maxPricePerSqFt?: number
    status?: string
    handoverFrom?: string
    handoverTo?: string
    limit?: number
    offset?: number
  }
}

/**
 * Fetch off-plan projects from GenieMap API.
 * Requires base_url in config and API key in secret.
 * Automatically paginates to fetch ALL projects (limit=1000 per request).
 */
export async function fetchGenieMapProjects(
  params: FetchProjectsParams
): Promise<GenieMapProjectInput[]> {
  const cred = await getCredential(params.workspaceId, "geniemap")
  if (!cred) throw new NotConfiguredError("geniemap")

  const baseUrl =
    (cred.config.base_url as string | undefined) || process.env.GENIEMAP_BASE_URL
  if (!baseUrl) {
    throw new Error(
      "GenieMap base_url not set. Add it in API Settings (config.base_url)."
    )
  }

  const f = params.filters || {}
  const pageSize = 1000 // Max allowed by API
  let offset = 0
  let allProjects: GenieMapProjectInput[] = []
  let hasMore = true
  let totalFromApi: number | null = null

  while (hasMore) {
    const url = new URL(`${baseUrl}/projects`)
    
    if (f.districtId) url.searchParams.set("districtId", String(f.districtId))
    if (f.developerId) url.searchParams.set("developerId", String(f.developerId))
    if (f.minPrice) url.searchParams.set("minPrice", String(f.minPrice))
    if (f.maxPrice) url.searchParams.set("maxPrice", String(f.maxPrice))
    if (f.minPricePerSqFt) url.searchParams.set("minPricePerSqFt", String(f.minPricePerSqFt))
    if (f.maxPricePerSqFt) url.searchParams.set("maxPricePerSqFt", String(f.maxPricePerSqFt))
    if (f.status) url.searchParams.set("status", f.status)
    if (f.handoverFrom) url.searchParams.set("handoverFrom", f.handoverFrom)
    if (f.handoverTo) url.searchParams.set("handoverTo", f.handoverTo)
    url.searchParams.set("limit", String(pageSize))
    url.searchParams.set("offset", String(offset))

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${cred.secret}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`GenieMap request failed: ${res.status} ${res.statusText}`)
    }

    const json = (await res.json()) as Record<string, unknown>
    
    // Check for total count in response metadata
    if (totalFromApi === null) {
      totalFromApi = (json.total as number) ?? (json.count as number) ?? (json.totalCount as number) ?? null
      if (totalFromApi) {
        console.log(`GenieMap API reports ${totalFromApi} total projects`)
      }
    }

    const batch = normalizeGenieMapProjects(json, params.workspaceId)
    console.log(`GenieMap: Fetched batch at offset ${offset}, got ${batch.length} projects`)
    
    allProjects = allProjects.concat(batch)
    offset += pageSize

    // Check if we should continue:
    // 1. If API gives total count, use that
    // 2. Otherwise, if batch < pageSize, we're done
    // 3. Also stop if batch is empty to prevent infinite loop
    if (batch.length === 0) {
      hasMore = false
    } else if (totalFromApi !== null) {
      hasMore = allProjects.length < totalFromApi
    } else {
      hasMore = batch.length >= pageSize
    }
  }

  console.log(`GenieMap: Total fetched ${allProjects.length} projects`)
  return allProjects
}

/**
 * Normalize GenieMap API response into database rows.
 * Handles common response shapes: { data: [...] }, { projects: [...] }, or raw array.
 */
function normalizeGenieMapProjects(
  payload: unknown,
  workspaceId: string
): GenieMapProjectInput[] {
  const records: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.data)
    ? (payload as any).data
    : Array.isArray((payload as any)?.projects)
    ? (payload as any).projects
    : Array.isArray((payload as any)?.hits)
    ? (payload as any).hits
    : []

  // Debug: Log first record to see actual structure
  if (records.length > 0) {
    const sample = records[0]
    console.log("GenieMap sample project structure:", JSON.stringify({
      id: sample.id,
      name: sample.name,
      unitPriceRange: sample.unitPriceRange,
      unitAreaRange: sample.unitAreaRange,
      priceRange: sample.priceRange,
      areaRange: sample.areaRange,
      price: sample.price,
      priceMin: sample.priceMin,
      price_min: sample.price_min,
      serviceCharge: sample.serviceCharge,
      // Check all possible nested structures
      hasUnitPriceRange: !!sample.unitPriceRange,
      unitPriceRangeKeys: sample.unitPriceRange ? Object.keys(sample.unitPriceRange) : [],
    }, null, 2))
  }

  return records
    .map((r) => {
      const id = r.id ?? r.project_id ?? r.external_id
      if (!id) return null

      const developer = r.developer || {}
      const district = r.district || r.location || {}
      
      // GenieMap uses `point` with `lat` and `lon` (string values)
      const point = r.point || {}
      const coords = r.coordinates || r.location || {}
      
      // Parse unitPriceRange and unitAreaRange (GenieMap format: { from, to })
      // API docs confirm these are the correct field names
      const priceRange = r.unitPriceRange || r.priceRange || {}
      const areaRange = r.unitAreaRange || r.areaRange || {}
      
      // Debug log for price extraction
      if (r.unitPriceRange || r.unitAreaRange) {
        console.log(`Project ${r.name}: priceRange=${JSON.stringify(priceRange)}, areaRange=${JSON.stringify(areaRange)}`)
      }

      // Parse unitTypes or unitLayouts for bedroom info
      const unitTypes: GenieMapUnitType[] = Array.isArray(r.unitTypes || r.unit_types || r.units || r.unitLayouts)
        ? (r.unitTypes || r.unit_types || r.units || r.unitLayouts).map((u: any) => ({
            type: u.name || u.type || u.unit_type || "Unknown",
            layout: u.layout || u.unit_layout || u.name || "",
            beds: Number(u.beds || u.bedrooms || extractBedsFromName(u.name) || 0),
            baths: Number(u.baths || u.bathrooms || 0),
            area: Number(u.area || u.size || 0),
            price: Number(u.price || u.starting_price || 0),
          }))
        : []

      const status = parseStatus(r.status)
      
      // Extract price values (GenieMap uses unitPriceRange.from/to)
      const priceMin = priceRange.from ?? r.price_min ?? r.priceMin ?? r.starting_price ?? null
      const priceMax = priceRange.to ?? r.price_max ?? r.priceMax ?? null
      
      // Extract area values (GenieMap uses unitAreaRange.from/to)
      const areaMin = areaRange.from ?? r.area_min ?? r.areaMin ?? r.min_area ?? null
      const areaMax = areaRange.to ?? r.area_max ?? r.areaMax ?? r.max_area ?? null
      
      // Calculate price per sqft if we have price and area
      let pricePerSqft = r.price_per_sqft ?? r.pricePerSqFt ?? r.price_psf ?? null
      if (!pricePerSqft && priceMin && areaMin && areaMin > 0) {
        pricePerSqft = Math.round(priceMin / areaMin)
      }
      
      // Extract coordinates (GenieMap uses point.lat/point.lon as strings)
      const lat = parseFloat(point.lat) || coords.lat || coords.latitude || r.lat || r.latitude || null
      const lng = parseFloat(point.lon) || parseFloat(point.lng) || coords.lng || coords.longitude || r.lng || r.longitude || null
      
      // Extract images array (GenieMap provides array of image URLs)
      const imagesArr: string[] = Array.isArray(r.images) ? r.images.filter((i: unknown) => typeof i === 'string') : []
      const imageUrl = imagesArr.length > 0 ? imagesArr[0] 
        : r.image_url ?? r.imageUrl ?? r.thumbnail ?? r.cover_image ?? null
      
      // Extract documents (PDFs, brochures)
      const documentsArr: string[] = Array.isArray(r.documents) ? r.documents.filter((d: unknown) => typeof d === 'string') : []
      
      // Extract description
      const description = typeof r.description === 'string' ? r.description 
        : (typeof r.description === 'object' && r.description?.en) ? r.description.en 
        : null
      
      // Extract amenities
      const amenitiesArr: string[] = Array.isArray(r.amenities) 
        ? r.amenities.map((a: any) => a.name || a.title || String(a)).filter(Boolean)
        : []
      
      // Extract payment plans
      const paymentPlans: Record<string, unknown>[] = Array.isArray(r.paymentPlans) ? r.paymentPlans : []

      return {
        workspace_id: workspaceId,
        external_id: Number(id),
        name: String(r.name || r.project_name || "Unknown"),
        developer_name: developer.name || r.developer_name || null,
        developer_id: developer.id || r.developer_id || null,
        district_name: district.name || r.district_name || r.area || null,
        district_id: district.id || r.district_id || null,
        status,
        price_min: priceMin,
        price_max: priceMax,
        price_per_sqft: pricePerSqft,
        area_min: areaMin,
        area_max: areaMax,
        handover_date: parseDate(r.handover_date ?? r.handoverDate ?? r.handover),
        service_charge: r.service_charge ?? r.serviceCharge ?? null,
        eoi_amount: r.eoi ?? r.eoi_amount ?? r.eoiAmount ?? null,
        unit_types: unitTypes,
        latitude: lat,
        longitude: lng,
        image_url: imageUrl,
        images: imagesArr,
        documents: documentsArr,
        description,
        amenities: amenitiesArr,
        payment_plans: paymentPlans,
        raw: r,
      } as GenieMapProjectInput
    })
    .filter((row): row is GenieMapProjectInput => row !== null && row.name !== "Unknown")
}

// Extract bedroom count from layout name like "1 BR", "2 BR", "Studio"
function extractBedsFromName(name: string | undefined): number {
  if (!name) return 0
  if (name.toLowerCase().includes("studio")) return 0
  const match = name.match(/(\d+)\s*BR/i)
  return match ? parseInt(match[1], 10) : 0
}

function parseStatus(status: unknown): "available" | "sold_out" | "launch" | null {
  if (!status) return null
  const s = String(status).toLowerCase()
  if (s.includes("available") || s === "active") return "available"
  if (s.includes("sold") || s === "sold_out") return "sold_out"
  if (s.includes("launch") || s === "upcoming" || s === "new") return "launch"
  return null
}

function parseDate(date: unknown): string | null {
  if (!date) return null
  if (typeof date === "string") {
    const d = new Date(date)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return null
}

