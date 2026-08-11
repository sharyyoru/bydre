import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// GET - List alerts for workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get("workspace_id")
    const unreadOnly = searchParams.get("unread_only") === "true"
    const limit = parseInt(searchParams.get("limit") || "20")

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
      .from("project_alerts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gt("expires_at", new Date().toISOString())
      .order("triggered_at", { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, error } = await query

    if (error) {
      console.error("Alerts fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
    }

    return NextResponse.json({ alerts: data || [] })
  } catch (err) {
    console.error("Alerts GET error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// PATCH - Mark alert as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, alert_id, mark_all_read } = body

    if (!workspace_id) {
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
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    const admin = createAdminClient()
    const updateData = {
      is_read: true,
      read_at: new Date().toISOString(),
      read_by: user.id,
    }

    if (mark_all_read) {
      await admin
        .from("project_alerts")
        .update(updateData)
        .eq("workspace_id", workspace_id)
        .eq("is_read", false)
    } else if (alert_id) {
      await admin
        .from("project_alerts")
        .update(updateData)
        .eq("id", alert_id)
        .eq("workspace_id", workspace_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Alerts PATCH error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
