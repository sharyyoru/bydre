import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// GET - List recent market signals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get("workspace_id")
    const signalType = searchParams.get("type")
    const limit = parseInt(searchParams.get("limit") || "20")
    const days = parseInt(searchParams.get("days") || "7")

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
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)

    let query = admin
      .from("market_signals")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gte("signal_date", sinceDate.toISOString())
      .order("signal_date", { ascending: false })
      .limit(limit)

    if (signalType) {
      query = query.eq("signal_type", signalType)
    }

    const { data, error } = await query

    if (error) {
      console.error("Signals fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 })
    }

    return NextResponse.json({ signals: data || [] })
  } catch (err) {
    console.error("Signals GET error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST - Manually add a signal (for testing/admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, signal_type, source, title, description, project_name, sentiment, trend_change_pct } = body

    if (!workspace_id || !signal_type || !source) {
      return NextResponse.json({ error: "workspace_id, signal_type, and source required" }, { status: 400 })
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
      .from("market_signals")
      .insert({
        workspace_id,
        signal_type,
        source,
        title,
        description,
        project_name,
        sentiment,
        trend_change_pct,
        signal_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Signal create error:", error)
      return NextResponse.json({ error: "Failed to create signal" }, { status: 500 })
    }

    return NextResponse.json({ signal: data })
  } catch (err) {
    console.error("Signals POST error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
