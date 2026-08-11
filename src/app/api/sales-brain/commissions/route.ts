import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CommissionInput } from "@/lib/sales-brain/types"

export const dynamic = "force-dynamic"

// GET - List commissions for workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get("workspace_id")
    const activeOnly = searchParams.get("active_only") !== "false"

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check workspace membership
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    const admin = createAdminClient()
    let query = admin
      .from("project_commissions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("Commissions fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 })
    }

    return NextResponse.json({ commissions: data || [] })
  } catch (err) {
    console.error("Commissions GET error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST - Create new commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, ...commissionData } = body as { workspace_id: string } & CommissionInput

    if (!workspace_id || !commissionData.project_name || commissionData.base_commission_percent === undefined) {
      return NextResponse.json(
        { error: "workspace_id, project_name, and base_commission_percent required" },
        { status: 400 }
      )
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

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("project_commissions")
      .insert({
        workspace_id,
        project_id: commissionData.project_id || null,
        project_name: commissionData.project_name,
        developer_name: commissionData.developer_name || null,
        base_commission_percent: commissionData.base_commission_percent,
        early_bird_bonus_percent: commissionData.early_bird_bonus_percent || null,
        early_bird_deadline: commissionData.early_bird_deadline || null,
        volume_bonus_percent: commissionData.volume_bonus_percent || null,
        volume_threshold: commissionData.volume_threshold || null,
        payment_terms: commissionData.payment_terms || null,
        special_incentives: commissionData.special_incentives || null,
        valid_from: commissionData.valid_from || null,
        valid_until: commissionData.valid_until || null,
        notes: commissionData.notes || null,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Commission create error:", error)
      return NextResponse.json({ error: "Failed to create commission" }, { status: 500 })
    }

    return NextResponse.json({ commission: data })
  } catch (err) {
    console.error("Commissions POST error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// PATCH - Update commission
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, commission_id, ...updates } = body

    if (!workspace_id || !commission_id) {
      return NextResponse.json({ error: "workspace_id and commission_id required" }, { status: 400 })
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

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("project_commissions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commission_id)
      .eq("workspace_id", workspace_id)
      .select()
      .single()

    if (error) {
      console.error("Commission update error:", error)
      return NextResponse.json({ error: "Failed to update commission" }, { status: 500 })
    }

    return NextResponse.json({ commission: data })
  } catch (err) {
    console.error("Commissions PATCH error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// DELETE - Soft delete (set inactive)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get("workspace_id")
    const commissionId = searchParams.get("commission_id")

    if (!workspaceId || !commissionId) {
      return NextResponse.json({ error: "workspace_id and commission_id required" }, { status: 400 })
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
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member || !["admin", "owner"].includes(member.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("project_commissions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", commissionId)
      .eq("workspace_id", workspaceId)

    if (error) {
      console.error("Commission delete error:", error)
      return NextResponse.json({ error: "Failed to delete commission" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Commissions DELETE error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
