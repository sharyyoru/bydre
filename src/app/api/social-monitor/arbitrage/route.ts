import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeArbitrage } from "@/lib/social-monitor/arbitrage"
import { generateArbitrageNarrative } from "@/lib/social-monitor/gemini"
import { NotConfiguredError, MarketMetric, SentimentMetric } from "@/lib/social-monitor/types"

/**
 * Compute arbitrage opportunities. Optionally include a Gemini narrative (?narrative=1).
 * Body: { workspace_id, narrative?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, narrative } = body
    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [{ data: market }, { data: sentiment }] = await Promise.all([
      supabase.from("dld_market_metrics").select("*").eq("workspace_id", workspace_id),
      supabase.from("social_sentiment_metrics").select("*").eq("workspace_id", workspace_id),
    ])

    const opportunities = computeArbitrage(
      (market || []) as MarketMetric[],
      (sentiment || []) as SentimentMetric[]
    )

    let narrativeText: string | null = null
    let narrativeError: string | null = null
    if (narrative && opportunities.length) {
      try {
        narrativeText = await generateArbitrageNarrative(workspace_id, opportunities)
      } catch (e) {
        if (e instanceof NotConfiguredError) narrativeError = "gemini not configured"
        else narrativeError = e instanceof Error ? e.message : "Narrative failed"
      }
    }

    return NextResponse.json({ opportunities, narrative: narrativeText, narrativeError })
  } catch (err) {
    console.error("arbitrage error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
