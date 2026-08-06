import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Realistic Dubai areas with market data
const DUBAI_AREAS = [
  { area: "Dubai Marina", type: "ready", txCount: 1245, totalValue: 4520000000, roi: 7.2 },
  { area: "Downtown Dubai", type: "ready", txCount: 892, totalValue: 6780000000, roi: 6.8 },
  { area: "Palm Jumeirah", type: "ready", txCount: 456, totalValue: 5890000000, roi: 5.9 },
  { area: "JVC", type: "off_plan", txCount: 2134, totalValue: 2890000000, roi: 9.1 },
  { area: "Business Bay", type: "ready", txCount: 1567, totalValue: 3450000000, roi: 7.5 },
  { area: "Dubai Hills Estate", type: "off_plan", txCount: 1823, totalValue: 4120000000, roi: 8.4 },
  { area: "Jumeirah Village Triangle", type: "off_plan", txCount: 987, totalValue: 1230000000, roi: 8.9 },
  { area: "Meydan", type: "off_plan", txCount: 654, totalValue: 1890000000, roi: 9.3 },
  { area: "Dubai Creek Harbour", type: "off_plan", txCount: 1234, totalValue: 3560000000, roi: 8.1 },
  { area: "DAMAC Hills", type: "off_plan", txCount: 876, totalValue: 1670000000, roi: 8.7 },
  { area: "Arabian Ranches", type: "ready", txCount: 234, totalValue: 1890000000, roi: 6.2 },
  { area: "Al Barsha", type: "ready", txCount: 567, totalValue: 890000000, roi: 7.8 },
  { area: "Jumeirah Beach Residence", type: "ready", txCount: 678, totalValue: 2340000000, roi: 6.5 },
  { area: "Motor City", type: "ready", txCount: 345, totalValue: 456000000, roi: 8.2 },
  { area: "Dubai Silicon Oasis", type: "ready", txCount: 432, totalValue: 567000000, roi: 8.5 },
]

// Sentiment data for keywords
const SENTIMENT_KEYWORDS = [
  { keyword: "Dubai Marina", platform: "google_trends", volume: 89000, velocity: 12, engagement: 45000 },
  { keyword: "Downtown Dubai", platform: "google_trends", volume: 125000, velocity: 18, engagement: 67000 },
  { keyword: "Palm Jumeirah", platform: "google_trends", volume: 156000, velocity: 8, engagement: 89000 },
  { keyword: "JVC apartments", platform: "google_trends", volume: 34000, velocity: 25, engagement: 12000 },
  { keyword: "Dubai Hills", platform: "google_trends", volume: 67000, velocity: 22, engagement: 34000 },
  { keyword: "Business Bay", platform: "google_trends", volume: 45000, velocity: 15, engagement: 23000 },
  { keyword: "Dubai property investment", platform: "google_trends", volume: 78000, velocity: 20, engagement: 56000 },
  { keyword: "Dubai off plan", platform: "google_trends", volume: 43000, velocity: 28, engagement: 19000 },
  { keyword: "Dubai Marina", platform: "youtube", volume: 12000, velocity: 5, engagement: 890000, videoCount: 2340 },
  { keyword: "Downtown Dubai", platform: "youtube", volume: 18000, velocity: 7, engagement: 1200000, videoCount: 3450 },
  { keyword: "Palm Jumeirah", platform: "youtube", volume: 25000, velocity: 4, engagement: 1500000, videoCount: 4560 },
  { keyword: "JVC Dubai", platform: "youtube", volume: 5600, velocity: 12, engagement: 230000, videoCount: 890 },
  { keyword: "Dubai property tour", platform: "youtube", volume: 34000, velocity: 15, engagement: 2300000, videoCount: 5670 },
  { keyword: "Dubai real estate", platform: "youtube", volume: 45000, velocity: 10, engagement: 3400000, videoCount: 7890 },
]

// Content briefs
const DEMO_BRIEFS = [
  {
    title: "JVC: Dubai's Hidden Gem for First-Time Investors",
    angle: "Affordability meets growth potential in Jumeirah Village Circle",
    hook: "Why savvy investors are quietly accumulating in JVC while everyone focuses on Downtown",
    summary: "JVC offers 9%+ ROI with entry prices 60% lower than prime areas. Perfect for portfolio diversification.",
    keywords: ["JVC", "Dubai investment", "affordable luxury"],
    target_area: "JVC",
    arbitrage_score: 85,
    status: "pending_review",
  },
  {
    title: "Dubai Hills Estate: The New Address of Choice",
    angle: "Master-planned community attracting families and investors alike",
    hook: "Inside the community that's redefining suburban luxury in Dubai",
    summary: "With the mall now open and metro coming, Dubai Hills is entering its value acceleration phase.",
    keywords: ["Dubai Hills", "family living", "community"],
    target_area: "Dubai Hills Estate",
    arbitrage_score: 72,
    status: "approved",
  },
  {
    title: "Meydan: The Quiet Performer Nobody's Talking About",
    angle: "Low social buzz, high market performance - classic arbitrage opportunity",
    hook: "9.3% ROI in an area most influencers haven't discovered yet",
    summary: "Meydan combines racecourse prestige with undervalued entry points. Early movers are positioning now.",
    keywords: ["Meydan", "ROI", "undervalued"],
    target_area: "Meydan",
    arbitrage_score: 91,
    status: "pending_review",
  },
  {
    title: "Dubai Creek Harbour: Waterfront Living Redefined",
    angle: "The next Downtown is taking shape along the historic creek",
    hook: "Why Dubai Creek Tower will do for this area what Burj Khalifa did for Downtown",
    summary: "Premium waterfront with 8%+ yields and significant appreciation potential as infrastructure completes.",
    keywords: ["Dubai Creek", "waterfront", "Emaar"],
    target_area: "Dubai Creek Harbour",
    arbitrage_score: 68,
    status: "scheduled",
  },
]

function getDateRange() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 1)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id: workspaceIdentifier } = body

    if (!workspaceIdentifier) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Resolve workspace_id (could be slug or UUID)
    let workspace_id = workspaceIdentifier
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceIdentifier)
    
    if (!isUUID) {
      // It's a slug, resolve to UUID
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceIdentifier)
        .maybeSingle()
      
      if (!ws) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
      }
      workspace_id = ws.id
    }
    
    const dates = getDateRange()
    const results = { market: 0, sentiment: 0, briefs: 0 }

    // 1. Seed Market Metrics
    const marketRows = DUBAI_AREAS.map((area) => ({
      workspace_id,
      area_name: area.area,
      property_type: null,
      registration_type: area.type,
      transaction_count: area.txCount + Math.floor(Math.random() * 100) - 50,
      total_value_aed: area.totalValue + Math.floor(Math.random() * 100000000) - 50000000,
      avg_value_aed: Math.round(area.totalValue / area.txCount),
      median_value_aed: Math.round((area.totalValue / area.txCount) * 0.92),
      roi_percent: area.roi + (Math.random() * 0.5 - 0.25),
      period_start: dates.start,
      period_end: dates.end,
      source: "demo_seed",
      raw: { seeded: true, original: area },
    }))

    const { error: marketError } = await supabase
      .from("dld_market_metrics")
      .upsert(marketRows, { onConflict: "workspace_id,area_name,registration_type,period_start,period_end" })

    if (!marketError) results.market = marketRows.length

    // 2. Seed Sentiment Metrics
    const sentimentRows = SENTIMENT_KEYWORDS.map((kw) => ({
      workspace_id,
      keyword: kw.keyword,
      platform: kw.platform,
      search_volume: kw.volume + Math.floor(Math.random() * 1000) - 500,
      velocity: kw.velocity + Math.floor(Math.random() * 5) - 2,
      engagement_score: kw.engagement + Math.floor(Math.random() * 10000) - 5000,
      video_count: kw.videoCount || null,
      geo: "AE",
      period_start: dates.start,
      period_end: dates.end,
      source: "demo_seed",
      raw: { seeded: true, original: kw },
    }))

    const { error: sentimentError } = await supabase
      .from("social_sentiment_metrics")
      .upsert(sentimentRows, { onConflict: "workspace_id,keyword,platform,period_start,period_end" })

    if (!sentimentError) results.sentiment = sentimentRows.length

    // 3. Seed Content Briefs
    const briefRows = DEMO_BRIEFS.map((brief) => ({
      workspace_id,
      title: brief.title,
      angle: brief.angle,
      hook: brief.hook,
      summary: brief.summary,
      platform_copy: {
        instagram: `🏠 ${brief.hook}\n\n${brief.summary}\n\n#DubaiRealEstate #Investment #${brief.keywords[0].replace(/\s/g, "")}`,
        tiktok: `${brief.hook} 🔥 ${brief.summary}`,
        youtube: `${brief.title} | Dubai Real Estate Investment Guide`,
        linkedin: `${brief.angle}\n\n${brief.summary}\n\nKey insight: ${brief.hook}`,
      },
      target_area: brief.target_area,
      keywords: brief.keywords,
      arbitrage_score: brief.arbitrage_score,
      status: brief.status,
      generated_by: "demo_seed",
      model: "demo",
      raw: { seeded: true },
    }))

    // Check existing briefs to avoid duplicates
    const { data: existingBriefs } = await supabase
      .from("content_briefs")
      .select("title")
      .eq("workspace_id", workspace_id)
      .eq("generated_by", "demo_seed")

    const existingTitles = new Set((existingBriefs || []).map((b: { title: string }) => b.title))
    const newBriefs = briefRows.filter((b) => !existingTitles.has(b.title))

    if (newBriefs.length > 0) {
      const { error: briefsError } = await supabase.from("content_briefs").insert(newBriefs)
      if (!briefsError) results.briefs = newBriefs.length
    }

    return NextResponse.json({
      success: true,
      inserted: results,
      message: `Seeded ${results.market} market metrics, ${results.sentiment} sentiment metrics, ${results.briefs} content briefs`,
    })
  } catch (error) {
    console.error("Demo seed error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    )
  }
}
