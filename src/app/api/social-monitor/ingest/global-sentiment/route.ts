import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  fetchMultipleKeywordTrends,
  aggregateCountryInterest,
  UAE_PROPERTY_KEYWORDS,
  CRYPTO_PROPERTY_KEYWORDS,
} from "@/lib/social-monitor/google-trends"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

function getDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30) // Last 30 days
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id: workspaceIdentifier, type = 'property' } = body

    if (!workspaceIdentifier) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    
    // Resolve workspace ID
    let workspace_id = workspaceIdentifier
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceIdentifier)
    
    if (!isUUID) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceIdentifier)
        .maybeSingle()
      
      if (!ws) {
        const { data: anyWs } = await supabase
          .from("workspaces")
          .select("id")
          .limit(1)
          .maybeSingle()
        if (anyWs) workspace_id = anyWs.id
        else return NextResponse.json({ error: "No workspace found" }, { status: 404 })
      } else {
        workspace_id = ws.id
      }
    }

    const dates = getDateRange()
    const keywords = type === 'crypto' ? CRYPTO_PROPERTY_KEYWORDS : UAE_PROPERTY_KEYWORDS
    
    // Fetch trends for all keywords
    const trends = await fetchMultipleKeywordTrends(keywords)
    
    // Aggregate country interest
    const countryInterest = aggregateCountryInterest(trends)
    
    // Delete existing data for this period
    await supabase
      .from("global_investment_sentiment")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("period_start", dates.start)
      .eq("period_end", dates.end)

    // Insert new data
    const rows = countryInterest.map((country) => {
      // Find trend direction from the aggregated data
      const firstKeywordResult = Array.from(trends.values())[0]
      const countryData = firstKeywordResult?.geoData.find(g => g.countryCode === country.countryCode)
      
      return {
        workspace_id,
        country_code: country.countryCode,
        country_name: country.countryName,
        search_interest: country.value,
        trend_direction: firstKeywordResult?.trendDirection || 'stable',
        trending_keywords: keywords.slice(0, 5),
        period_start: dates.start,
        period_end: dates.end,
        source: "google_trends",
        raw: { countryData },
      }
    })

    const { error } = await supabase
      .from("global_investment_sentiment")
      .insert(rows)

    if (error) {
      console.error("Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also save crypto sentiment if requested
    if (type === 'crypto') {
      const cryptoRows = Array.from(trends.entries()).map(([keyword, result]) => ({
        workspace_id,
        keyword,
        platform: "google_trends",
        search_volume: result.timelineData[result.timelineData.length - 1]?.value || 0,
        trend_direction: result.trendDirection,
        period_start: dates.start,
        period_end: dates.end,
        source: "google_trends",
        raw: { timeline: result.timelineData },
      }))

      await supabase
        .from("crypto_property_sentiment")
        .delete()
        .eq("workspace_id", workspace_id)
        .eq("period_start", dates.start)

      await supabase
        .from("crypto_property_sentiment")
        .insert(cryptoRows)
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      countries: countryInterest.slice(0, 5).map(c => c.countryName),
      message: `Ingested sentiment data for ${rows.length} countries`,
    })
  } catch (error) {
    console.error("Global sentiment error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 }
    )
  }
}
