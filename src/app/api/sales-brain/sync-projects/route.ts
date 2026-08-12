import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchGenieMapProjects } from "@/lib/social-monitor/geniemap"
import { NotConfiguredError } from "@/lib/social-monitor/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// POST - Sync offplan projects from GenieMap
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id } = body

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member || !["admin", "owner"].includes(member.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch projects from GenieMap
    const projects = await fetchGenieMapProjects({ workspaceId: workspace_id })

    if (!projects.length) {
      return NextResponse.json({ synced: 0, message: "No projects found in GenieMap" })
    }

    // Transform to geniemap_projects format
    const rows = projects.map(p => ({
      workspace_id,
      external_id: p.external_id,
      name: p.name,
      developer_name: p.developer_name,
      developer_id: p.developer_id,
      district_name: p.district_name,
      district_id: p.district_id,
      status: p.status,
      price_min: p.price_min,
      price_max: p.price_max,
      price_per_sqft: p.price_per_sqft,
      area_min: p.area_min,
      area_max: p.area_max,
      handover_date: p.handover_date,
      service_charge: p.service_charge,
      eoi_amount: p.eoi_amount,
      unit_types: p.unit_types || [],
      latitude: p.latitude,
      longitude: p.longitude,
      image_url: p.image_url,
      raw: p.raw || {},
      ingested_at: new Date().toISOString(),
    }))

    // Upsert projects to geniemap_projects (single source of truth)
    const admin = createAdminClient()
    const { error } = await admin
      .from("geniemap_projects")
      .upsert(rows, {
        onConflict: "workspace_id, external_id",
        ignoreDuplicates: false,
      })

    if (error) {
      console.error("Sync projects error:", error)
      return NextResponse.json({ error: "Failed to sync projects" }, { status: 500 })
    }

    // Also create inventory snapshots for velocity tracking
    const snapshots = projects
      .filter(p => p.unit_types?.length > 0)
      .map(p => {
        const totalUnits = p.unit_types.length // Simplified
        return {
          workspace_id,
          project_name: p.name,
          snapshot_date: new Date().toISOString().split("T")[0],
          total_units: totalUnits,
          available_units: p.status === "available" ? totalUnits : 0,
          sold_units: p.status === "sold_out" ? totalUnits : 0,
          avg_price_aed: p.price_min && p.price_max ? (p.price_min + p.price_max) / 2 : p.price_min,
          min_price_aed: p.price_min,
          max_price_aed: p.price_max,
          source: "geniemap",
        }
      })

    if (snapshots.length > 0) {
      await admin
        .from("inventory_snapshots")
        .upsert(snapshots, {
          onConflict: "workspace_id, project_name, snapshot_date",
          ignoreDuplicates: true,
        })
    }

    return NextResponse.json({ 
      synced: rows.length,
      snapshots: snapshots.length,
      message: `Synced ${rows.length} projects from GenieMap`
    })
  } catch (err) {
    if (err instanceof NotConfiguredError) {
      return NextResponse.json({ 
        error: "GenieMap not configured. Add API key in Settings > Integrations." 
      }, { status: 400 })
    }
    console.error("Sync projects error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
