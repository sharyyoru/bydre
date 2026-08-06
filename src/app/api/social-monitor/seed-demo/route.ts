import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client inline to avoid any import issues
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase credentials")
  }
  
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

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
  const errors: string[] = []
  
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    
    const { workspace_id: workspaceIdentifier } = body

    if (!workspaceIdentifier) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    // Create Supabase client
    let supabase
    try {
      supabase = getAdminClient()
    } catch (e) {
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: e instanceof Error ? e.message : "Unknown error"
      }, { status: 500 })
    }
    
    // Resolve workspace_id (could be slug or UUID)
    let workspace_id = workspaceIdentifier
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceIdentifier)
    
    if (!isUUID) {
      // It's a slug, resolve to UUID - try multiple approaches
      let ws: { id: string; slug: string; name: string } | null = null
      
      // 1. Try exact slug match
      const { data: wsData, error: wsError } = await supabase
        .from("workspaces")
        .select("id, slug, name")
        .eq("slug", workspaceIdentifier)
        .maybeSingle()
      
      ws = wsData
      
      // 2. If not found, try case-insensitive name match
      if (!ws) {
        const { data: wsByName } = await supabase
          .from("workspaces")
          .select("id, slug, name")
          .ilike("name", `%${workspaceIdentifier}%`)
          .limit(1)
          .maybeSingle()
        ws = wsByName
      }
      
      // 3. If still not found, just get the first workspace (for demo purposes)
      if (!ws) {
        const { data: anyWs } = await supabase
          .from("workspaces")
          .select("id, slug, name")
          .limit(1)
          .maybeSingle()
        ws = anyWs
      }
      
      if (wsError && !ws) {
        return NextResponse.json({ 
          error: "Failed to lookup workspace", 
          details: wsError.message 
        }, { status: 500 })
      }
      
      if (!ws) {
        return NextResponse.json({ 
          error: "No workspaces found in database. Please create a workspace first.",
          hint: "The demo seeder needs at least one workspace to exist."
        }, { status: 404 })
      }
      
      workspace_id = ws.id
      console.log(`Resolved workspace: ${workspaceIdentifier} -> ${ws.slug} (${ws.id})`)
    }
    
    const dates = getDateRange()
    const results = { market: 0, sentiment: 0, briefs: 0 }

    // 1. Delete existing demo data first (clean slate approach)
    await supabase
      .from("dld_market_metrics")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("source", "demo_seed")
    
    await supabase
      .from("social_sentiment_metrics")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("source", "demo_seed")

    // 2. Seed Market Metrics
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
      raw: { seeded: true },
    }))

    const { error: marketError } = await supabase
      .from("dld_market_metrics")
      .insert(marketRows)

    if (marketError) {
      errors.push(`Market: ${marketError.message}`)
    } else {
      results.market = marketRows.length
    }

    // 3. Seed Sentiment Metrics
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
      raw: { seeded: true },
    }))

    const { error: sentimentError } = await supabase
      .from("social_sentiment_metrics")
      .insert(sentimentRows)

    if (sentimentError) {
      errors.push(`Sentiment: ${sentimentError.message}`)
    } else {
      results.sentiment = sentimentRows.length
    }

    // 4. Seed Content Briefs (check for existing first)
    const { data: existingBriefs } = await supabase
      .from("content_briefs")
      .select("title")
      .eq("workspace_id", workspace_id)
      .eq("generated_by", "demo_seed")

    const existingTitles = new Set((existingBriefs || []).map((b: { title: string }) => b.title))
    
    const briefRows = DEMO_BRIEFS
      .filter((brief) => !existingTitles.has(brief.title))
      .map((brief) => ({
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

    if (briefRows.length > 0) {
      const { error: briefsError } = await supabase.from("content_briefs").insert(briefRows)
      if (briefsError) {
        errors.push(`Briefs: ${briefsError.message}`)
      } else {
        results.briefs = briefRows.length
      }
    }

    // 5. Seed Global Investment Sentiment
    const globalSentimentRows = [
      { country_code: "IN", country_name: "India", search_interest: 100, trend_direction: "up" },
      { country_code: "GB", country_name: "United Kingdom", search_interest: 85, trend_direction: "up" },
      { country_code: "PK", country_name: "Pakistan", search_interest: 78, trend_direction: "stable" },
      { country_code: "RU", country_name: "Russia", search_interest: 72, trend_direction: "up" },
      { country_code: "US", country_name: "United States", search_interest: 65, trend_direction: "stable" },
      { country_code: "CN", country_name: "China", search_interest: 58, trend_direction: "down" },
      { country_code: "EG", country_name: "Egypt", search_interest: 52, trend_direction: "up" },
      { country_code: "SA", country_name: "Saudi Arabia", search_interest: 48, trend_direction: "stable" },
      { country_code: "NG", country_name: "Nigeria", search_interest: 45, trend_direction: "up" },
      { country_code: "DE", country_name: "Germany", search_interest: 42, trend_direction: "stable" },
    ].map((c) => ({
      workspace_id,
      ...c,
      trending_keywords: ["Dubai property", "UAE investment", "off plan Dubai"],
      period_start: dates.start,
      period_end: dates.end,
      source: "demo_seed",
    }))

    // Delete existing demo global sentiment
    await supabase
      .from("global_investment_sentiment")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("source", "demo_seed")

    const { error: globalError } = await supabase
      .from("global_investment_sentiment")
      .insert(globalSentimentRows)

    if (globalError) {
      errors.push(`Global: ${globalError.message}`)
    }

    // 6. Seed Crypto Property Sentiment
    const cryptoSentimentRows = [
      { keyword: "Buy property with Bitcoin Dubai", search_volume: 68, trend_direction: "up" },
      { keyword: "Crypto real estate UAE", search_volume: 54, trend_direction: "up" },
      { keyword: "Bitcoin payment Dubai property", search_volume: 42, trend_direction: "stable" },
      { keyword: "USDT real estate Dubai", search_volume: 38, trend_direction: "up" },
      { keyword: "Cryptocurrency property investment", search_volume: 35, trend_direction: "stable" },
    ].map((c) => ({
      workspace_id,
      ...c,
      platform: "google_trends",
      period_start: dates.start,
      period_end: dates.end,
      source: "demo_seed",
    }))

    // Delete existing demo crypto sentiment
    await supabase
      .from("crypto_property_sentiment")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("source", "demo_seed")

    const { error: cryptoError } = await supabase
      .from("crypto_property_sentiment")
      .insert(cryptoSentimentRows)

    if (cryptoError) {
      errors.push(`Crypto: ${cryptoError.message}`)
    }

    // Return results
    if (errors.length > 0 && results.market === 0 && results.sentiment === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to seed data",
        details: errors,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: results,
      message: `Seeded ${results.market} market metrics, ${results.sentiment} sentiment metrics, ${results.briefs} content briefs`,
      warnings: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Demo seed error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    )
  }
}
