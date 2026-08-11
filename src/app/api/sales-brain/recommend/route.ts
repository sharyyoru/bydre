import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRecommendations, generateRecommendations } from "@/lib/sales-brain/ai-advisor"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// GET - Get cached or generate recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const workspaceId = searchParams.get("workspace_id")
    const limit = parseInt(searchParams.get("limit") || "5")
    const refresh = searchParams.get("refresh") === "true"

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

    // Get recommendations (cached or fresh)
    const result = refresh 
      ? await generateRecommendations({ workspace_id: workspaceId, limit, include_reasoning: true })
      : await getRecommendations({ workspace_id: workspaceId, limit, include_reasoning: true })

    return NextResponse.json(result)
  } catch (err) {
    console.error("Recommend GET error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST - Force generate new recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, limit = 5, area_filter, developer_filter, min_commission } = body

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

    const result = await generateRecommendations({
      workspace_id,
      limit,
      area_filter,
      developer_filter,
      min_commission,
      include_reasoning: true,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error("Recommend POST error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
