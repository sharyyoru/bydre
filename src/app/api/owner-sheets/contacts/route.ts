import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get("workspaceId")
    const area = searchParams.get("area")
    const building = searchParams.get("building")
    const ownerType = searchParams.get("owner_type")
    const nationality = searchParams.get("nationality")
    const duplicatesOnly = searchParams.get("duplicatesOnly") === "true"
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "500")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Build query
    let query = supabase
      .from("owner_contacts")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (area) query = query.eq("area", area)
    if (building) query = query.eq("building", building)
    if (ownerType) query = query.eq("owner_type", ownerType)
    if (nationality) query = query.eq("nationality", nationality)
    if (duplicatesOnly) query = query.eq("is_duplicate", true)
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: contacts, count, error } = await query

    if (error) {
      console.error("Query error:", error)
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
    }

    // Get distinct values for filter options
    const [areasRes, buildingsRes, ownerTypesRes, nationalitiesRes] = await Promise.all([
      supabase
        .from("owner_contacts")
        .select("area")
        .eq("workspace_id", workspaceId)
        .not("area", "is", null)
        .order("area"),
      supabase
        .from("owner_contacts")
        .select("building")
        .eq("workspace_id", workspaceId)
        .not("building", "is", null)
        .order("building"),
      supabase
        .from("owner_contacts")
        .select("owner_type")
        .eq("workspace_id", workspaceId)
        .not("owner_type", "is", null)
        .order("owner_type"),
      supabase
        .from("owner_contacts")
        .select("nationality")
        .eq("workspace_id", workspaceId)
        .not("nationality", "is", null)
        .order("nationality"),
    ])

    // Get unique values
    const uniqueAreas = Array.from(new Set((areasRes.data || []).map((r) => r.area).filter(Boolean)))
    const uniqueBuildings = Array.from(new Set((buildingsRes.data || []).map((r) => r.building).filter(Boolean)))
    const uniqueOwnerTypes = Array.from(new Set((ownerTypesRes.data || []).map((r) => r.owner_type).filter(Boolean)))
    const uniqueNationalities = Array.from(new Set((nationalitiesRes.data || []).map((r) => r.nationality).filter(Boolean)))

    return NextResponse.json({
      contacts: contacts || [],
      total: count || 0,
      filterOptions: {
        areas: uniqueAreas as string[],
        buildings: uniqueBuildings as string[],
        owner_types: uniqueOwnerTypes as string[],
        nationalities: uniqueNationalities as string[],
      },
    })
  } catch (error) {
    console.error("Contacts error:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
