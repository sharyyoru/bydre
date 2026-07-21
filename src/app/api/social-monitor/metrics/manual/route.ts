import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireWorkspaceAdmin } from "../../_helpers"

/**
 * Manual / CSV entry fallback. Inserts market or sentiment rows without any API key.
 * Body: { workspace_id, kind: 'market' | 'sentiment', rows: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, kind, rows } = body

    if (!workspace_id || !kind || !Array.isArray(rows) || !rows.length) {
      return NextResponse.json(
        { error: "workspace_id, kind, rows[] required" },
        { status: 400 }
      )
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const admin = createAdminClient()

    if (kind === "market") {
      const prepared = rows.map((r: any) => ({
        workspace_id,
        area_name: String(r.area_name || "").trim(),
        property_type: r.property_type || null,
        registration_type: r.registration_type === "off_plan" ? "off_plan" : "ready",
        transaction_count: Number(r.transaction_count) || 0,
        total_value_aed: Number(r.total_value_aed) || 0,
        avg_value_aed:
          Number(r.avg_value_aed) ||
          (Number(r.transaction_count)
            ? Number(r.total_value_aed) / Number(r.transaction_count)
            : 0),
        median_value_aed: r.median_value_aed != null ? Number(r.median_value_aed) : null,
        roi_percent: r.roi_percent != null ? Number(r.roi_percent) : null,
        period_start: r.period_start,
        period_end: r.period_end,
        source: "manual",
        raw: {},
      }))
      const { error } = await admin
        .from("dld_market_metrics")
        .upsert(prepared, {
          onConflict: "workspace_id, area_name, registration_type, period_start, period_end",
        })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ inserted: prepared.length })
    }

    if (kind === "sentiment") {
      const prepared = rows.map((r: any) => ({
        workspace_id,
        keyword: String(r.keyword || "").trim(),
        platform: r.platform === "youtube" ? "youtube" : "google_trends",
        search_volume: r.search_volume != null ? Number(r.search_volume) : null,
        velocity: r.velocity != null ? Number(r.velocity) : null,
        engagement_score: r.engagement_score != null ? Number(r.engagement_score) : null,
        video_count: r.video_count != null ? Number(r.video_count) : null,
        geo: r.geo || "AE",
        period_start: r.period_start,
        period_end: r.period_end,
        source: "manual",
        raw: {},
      }))
      const { error } = await admin
        .from("social_sentiment_metrics")
        .upsert(prepared, {
          onConflict: "workspace_id, keyword, platform, period_start, period_end",
        })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ inserted: prepared.length })
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  } catch (err) {
    console.error("metrics/manual error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
