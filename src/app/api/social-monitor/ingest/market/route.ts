import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchMarketMetrics } from "@/lib/social-monitor/dubai-pulse"
import { NotConfiguredError } from "@/lib/social-monitor/types"
import { requireWorkspaceAdmin, notConfigured } from "../../_helpers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, period_start, period_end, areas } = body

    if (!workspace_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: "workspace_id, period_start, period_end required" },
        { status: 400 }
      )
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const rows = await fetchMarketMetrics({
      workspaceId: workspace_id,
      periodStart: period_start,
      periodEnd: period_end,
      areas,
    })

    if (!rows.length) {
      return NextResponse.json({ inserted: 0, message: "No records returned" })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("dld_market_metrics")
      .upsert(rows, {
        onConflict: "workspace_id, area_name, registration_type, period_start, period_end",
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length })
  } catch (err) {
    if (err instanceof NotConfiguredError) return notConfigured(err.provider)
    console.error("ingest/market error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
