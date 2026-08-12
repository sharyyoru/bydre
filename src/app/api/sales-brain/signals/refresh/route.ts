import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCredential } from "@/lib/social-monitor/credentials"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// POST - Refresh market signals by fetching latest data
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
    const signalsCreated: string[] = []

    // 1. Check for recent project launches from geniemap_projects
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentProjects } = await admin
      .from("geniemap_projects")
      .select("name, developer_name, district_name, status, ingested_at")
      .eq("workspace_id", workspace_id)
      .eq("status", "launch")
      .gte("ingested_at", thirtyDaysAgo.toISOString())
      .limit(10)

    // Create launch signals for new projects
    for (const project of recentProjects || []) {
      const existingSignal = await admin
        .from("market_signals")
        .select("id")
        .eq("workspace_id", workspace_id)
        .eq("signal_type", "launch")
        .eq("project_name", project.name)
        .maybeSingle()

      if (!existingSignal.data) {
        await admin.from("market_signals").insert({
          workspace_id,
          signal_type: "launch",
          source: "geniemap",
          project_name: project.name,
          developer_name: project.developer_name,
          area_name: project.district_name,
          title: `New Launch: ${project.name}`,
          description: `${project.developer_name || "Developer"} has launched ${project.name} in ${project.district_name || "Dubai"}`,
          sentiment: "positive",
          signal_date: project.ingested_at,
        })
        signalsCreated.push(`launch:${project.name}`)
      }
    }

    // 2. Generate AI-powered market insights if Gemini is configured
    const cred = await getCredential(workspace_id, "gemini")
    if (cred) {
      try {
        const genAI = new GoogleGenerativeAI(cred.secret)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Get recent market data for context
        const { data: marketData } = await admin
          .from("dld_market_metrics")
          .select("area_name, transaction_count, total_value_aed, roi_percent")
          .eq("workspace_id", workspace_id)
          .order("period_end", { ascending: false })
          .limit(10)

        if (marketData && marketData.length > 0) {
          const prompt = `Analyze this Dubai real estate market data and identify 2-3 key trends or signals that would be valuable for agents:
${JSON.stringify(marketData, null, 2)}

Respond with JSON array:
[{"title": "Trend title", "description": "Brief description", "area": "Area name or null", "sentiment": "positive|negative|neutral"}]`

          const result = await model.generateContent(prompt)
          const text = result.response.text()
          
          const jsonMatch = text.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const trends = JSON.parse(jsonMatch[0]) as Array<{
              title: string
              description: string
              area: string | null
              sentiment: "positive" | "negative" | "neutral"
            }>

            for (const trend of trends) {
              await admin.from("market_signals").insert({
                workspace_id,
                signal_type: "trend",
                source: "ai_analysis",
                area_name: trend.area,
                title: trend.title,
                description: trend.description,
                sentiment: trend.sentiment,
                signal_date: new Date().toISOString(),
              })
              signalsCreated.push(`trend:${trend.title}`)
            }
          }
        }
      } catch (err) {
        console.warn("AI signal generation failed:", err)
      }
    }

    // 3. Check inventory velocity changes and create alerts
    const { data: velocityData } = await admin
      .from("inventory_snapshots")
      .select("project_name, available_units, total_units, snapshot_date")
      .eq("workspace_id", workspace_id)
      .order("snapshot_date", { ascending: false })
      .limit(50)

    // Group by project and detect significant changes
    const projectSnapshots: Record<string, Array<{
      project_name: string
      available_units: number | null
      total_units: number | null
      snapshot_date: string
    }>> = {}
    
    for (const snapshot of velocityData || []) {
      if (!projectSnapshots[snapshot.project_name]) {
        projectSnapshots[snapshot.project_name] = []
      }
      projectSnapshots[snapshot.project_name].push(snapshot)
    }

    for (const projectName of Object.keys(projectSnapshots)) {
      const snapshots = projectSnapshots[projectName]
      if (snapshots.length >= 2) {
        const latest = snapshots[0]
        const previous = snapshots[1]
        
        if (latest.available_units !== null && previous.available_units !== null) {
          const soldUnits = previous.available_units - latest.available_units
          const totalUnits = latest.total_units || previous.total_units || 100
          const soldPct = (soldUnits / totalUnits) * 100

          // Significant velocity spike (>5% sold in one period)
          if (soldPct > 5) {
            const existingAlert = await admin
              .from("market_signals")
              .select("id")
              .eq("workspace_id", workspace_id)
              .eq("signal_type", "trend")
              .eq("project_name", projectName)
              .gte("signal_date", thirtyDaysAgo.toISOString())
              .maybeSingle()

            if (!existingAlert.data) {
              await admin.from("market_signals").insert({
                workspace_id,
                signal_type: "trend",
                source: "velocity_tracker",
                project_name: projectName,
                title: `High Velocity: ${projectName}`,
                description: `${soldUnits} units sold recently (${soldPct.toFixed(1)}% of inventory)`,
                sentiment: "positive",
                trend_change_pct: soldPct,
                signal_date: new Date().toISOString(),
              })
              signalsCreated.push(`velocity:${projectName}`)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      signals_created: signalsCreated.length,
      details: signalsCreated,
    })
  } catch (err) {
    console.error("Signals refresh error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
