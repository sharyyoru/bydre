import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateBrief } from "@/lib/social-monitor/gemini"
import { NotConfiguredError, ArbitrageOpportunity } from "@/lib/social-monitor/types"
import { requireWorkspaceAdmin, notConfigured } from "../../_helpers"

/**
 * Generate a content brief from an arbitrage opportunity via Gemini.
 * Body: { workspace_id, opportunity }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, opportunity } = body as {
      workspace_id: string
      opportunity: ArbitrageOpportunity
    }

    if (!workspace_id || !opportunity) {
      return NextResponse.json(
        { error: "workspace_id and opportunity required" },
        { status: 400 }
      )
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const { brief, model } = await generateBrief(workspace_id, opportunity)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("content_briefs")
      .insert({
        workspace_id,
        title: brief.title,
        angle: brief.angle,
        hook: brief.hook,
        summary: brief.summary,
        platform_copy: brief.platform_copy,
        target_area: opportunity.area_name,
        keywords: brief.keywords,
        arbitrage_score: opportunity.arbitrage_score,
        status: "pending_review",
        source_market_metric_id: opportunity.market_metric_id,
        source_sentiment_metric_id: opportunity.sentiment_metric_id,
        generated_by: "gemini",
        model,
        raw: brief as unknown as Record<string, unknown>,
        created_by: auth.userId,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ brief: data }, { status: 201 })
  } catch (err) {
    if (err instanceof NotConfiguredError) return notConfigured(err.provider)
    console.error("briefs/generate error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
