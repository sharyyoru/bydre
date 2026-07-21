import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchTrends } from "@/lib/social-monitor/serpapi-trends"
import { fetchYouTube } from "@/lib/social-monitor/youtube"
import { NotConfiguredError } from "@/lib/social-monitor/types"
import { requireWorkspaceAdmin, notConfigured } from "../../_helpers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, keywords, geo, period_start, period_end } = body

    if (!workspace_id || !Array.isArray(keywords) || !keywords.length || !period_start || !period_end) {
      return NextResponse.json(
        { error: "workspace_id, keywords[], period_start, period_end required" },
        { status: 400 }
      )
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const params = {
      workspaceId: workspace_id,
      keywords,
      geo,
      periodStart: period_start,
      periodEnd: period_end,
    }

    // Run both providers; if one is unconfigured, still ingest the other.
    const rows: any[] = []
    const warnings: string[] = []

    try {
      rows.push(...(await fetchTrends(params)))
    } catch (e) {
      if (e instanceof NotConfiguredError) warnings.push("serpapi not configured")
      else throw e
    }

    try {
      rows.push(...(await fetchYouTube(params)))
    } catch (e) {
      if (e instanceof NotConfiguredError) warnings.push("youtube not configured")
      else throw e
    }

    if (!rows.length) {
      return NextResponse.json(
        { inserted: 0, warnings, error: warnings.length ? "No providers configured" : undefined },
        { status: warnings.length ? 501 : 200 }
      )
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("social_sentiment_metrics")
      .upsert(rows, {
        onConflict: "workspace_id, keyword, platform, period_start, period_end",
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length, warnings })
  } catch (err) {
    if (err instanceof NotConfiguredError) return notConfigured(err.provider)
    console.error("ingest/sentiment error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
