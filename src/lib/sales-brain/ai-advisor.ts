// AI Sales Advisor
// Uses Gemini to synthesize inventory, commissions, and demand signals
// into actionable recommendations for agents

import { GoogleGenerativeAI } from "@google/generative-ai"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCredential } from "@/lib/social-monitor/credentials"
import { getTopVelocityProjects } from "./velocity-engine"
import { 
  SalesOpportunity, 
  ProjectCommission, 
  MarketSignal,
  RecommendationRequest,
  RecommendationResponse 
} from "./types"

const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]

interface ProjectData {
  project_id: string | null
  project_name: string
  developer_name: string | null
  district_name: string | null
  price_min: number | null
  price_max: number | null
  handover_date: string | null
  status: string | null
  image_url: string | null
}

/**
 * Generate AI-powered sales recommendations.
 * Synthesizes velocity, commissions, and market signals into ranked opportunities.
 */
export async function generateRecommendations(
  params: RecommendationRequest
): Promise<RecommendationResponse> {
  const { workspace_id, limit = 5, include_reasoning = true } = params
  const admin = createAdminClient()

  // 1. Get velocity data
  const velocityMetrics = await getTopVelocityProjects(workspace_id, 20)

  // 2. Get active commissions
  const { data: commissions } = await admin
    .from("project_commissions")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("is_active", true)

  const commissionMap = new Map<string, ProjectCommission>()
  for (const c of (commissions || []) as ProjectCommission[]) {
    commissionMap.set(c.project_name.toLowerCase(), c)
  }

  // 3. Get recent market signals (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: signals } = await admin
    .from("market_signals")
    .select("*")
    .eq("workspace_id", workspace_id)
    .gte("signal_date", sevenDaysAgo.toISOString())
    .order("signal_date", { ascending: false })
    .limit(50)

  // 4. Get project details from geniemap_projects (source of truth for project data)
  const { data: projects } = await admin
    .from("geniemap_projects")
    .select("id, name, developer_name, district_name, price_min, price_max, handover_date, status, image_url")
    .eq("workspace_id", workspace_id)
    .limit(100)

  const projectMap = new Map<string, ProjectData>()
  for (const p of (projects || [])) {
    projectMap.set(p.name.toLowerCase(), {
      project_id: p.id,
      project_name: p.name,
      developer_name: p.developer_name,
      district_name: p.district_name,
      price_min: p.price_min,
      price_max: p.price_max,
      handover_date: p.handover_date,
      status: p.status,
      image_url: p.image_url,
    })
  }

  // 5. Score and rank opportunities
  const opportunities: SalesOpportunity[] = []
  
  for (const velocity of velocityMetrics) {
    const projectKey = velocity.project_name.toLowerCase()
    const commission = commissionMap.get(projectKey)
    const project = projectMap.get(projectKey)
    
    // Calculate component scores
    const velocityScore = velocity.velocity_score
    
    // Commission score (0-100): higher commission = higher score
    let commissionScore = 0
    let effectiveCommission = 0
    if (commission) {
      effectiveCommission = commission.base_commission_percent + 
        (commission.early_bird_bonus_percent || 0)
      // 8%+ = 100, 6-8% = 80, 4-6% = 60, 2-4% = 40, <2% = 20
      if (effectiveCommission >= 8) commissionScore = 100
      else if (effectiveCommission >= 6) commissionScore = 80
      else if (effectiveCommission >= 4) commissionScore = 60
      else if (effectiveCommission >= 2) commissionScore = 40
      else commissionScore = 20
    } else {
      commissionScore = 30 // Unknown commission gets neutral score
    }

    // Demand score based on signals
    const relatedSignals = (signals || []).filter((s: MarketSignal) => 
      s.project_name?.toLowerCase() === projectKey ||
      s.developer_name?.toLowerCase() === project?.developer_name?.toLowerCase()
    )
    let demandScore = 50 // Neutral baseline
    for (const signal of relatedSignals) {
      if (signal.sentiment === "positive") demandScore += 10
      if (signal.trend_change_pct && signal.trend_change_pct > 0) {
        demandScore += Math.min(20, signal.trend_change_pct / 5)
      }
    }
    demandScore = Math.min(100, Math.max(0, demandScore))

    // Urgency score based on inventory + handover
    let urgencyScore = 0
    if (velocity.inventory_remaining_pct < 20) urgencyScore += 40
    else if (velocity.inventory_remaining_pct < 40) urgencyScore += 25
    else if (velocity.inventory_remaining_pct < 60) urgencyScore += 15
    
    if (project?.handover_date) {
      const handover = new Date(project.handover_date)
      const monthsToHandover = Math.ceil((handover.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))
      if (monthsToHandover <= 6) urgencyScore += 30
      else if (monthsToHandover <= 12) urgencyScore += 20
      else if (monthsToHandover <= 24) urgencyScore += 10
    }
    urgencyScore = Math.min(100, urgencyScore)

    // Overall score: weighted combination
    const overallScore = Math.round(
      velocityScore * 0.30 +
      commissionScore * 0.30 +
      demandScore * 0.20 +
      urgencyScore * 0.20
    )

    opportunities.push({
      id: crypto.randomUUID(),
      workspace_id,
      project_id: project?.project_id || null,
      project_name: velocity.project_name,
      developer_name: project?.developer_name || null,
      overall_score: overallScore,
      velocity_score: velocityScore,
      commission_score: commissionScore,
      demand_score: demandScore,
      urgency_score: urgencyScore,
      daily_sales_rate: velocity.daily_sales_rate,
      inventory_remaining_pct: velocity.inventory_remaining_pct,
      days_to_sellout: velocity.days_to_sellout,
      effective_commission_pct: effectiveCommission || null,
      reasoning: null, // Will be filled by AI
      key_selling_points: [],
      target_buyer_profile: null,
      computed_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      rank: 0,
      created_at: new Date().toISOString(),
    })
  }

  // Sort by overall score
  opportunities.sort((a, b) => b.overall_score - a.overall_score)

  // Assign ranks and limit
  const topOpportunities = opportunities.slice(0, limit).map((opp, idx) => ({
    ...opp,
    rank: idx + 1,
  }))

  // 6. Generate AI reasoning if requested
  let marketSummary: string | null = null
  if (include_reasoning && topOpportunities.length > 0) {
    const reasoningResult = await generateAIReasoning(
      workspace_id,
      topOpportunities,
      commissionMap,
      signals as MarketSignal[] || []
    )
    
    if (reasoningResult) {
      marketSummary = reasoningResult.marketSummary
      
      // Apply reasoning to opportunities
      for (const opp of topOpportunities) {
        const oppReasoning = reasoningResult.opportunities.find(
          r => r.project_name.toLowerCase() === opp.project_name.toLowerCase()
        )
        if (oppReasoning) {
          opp.reasoning = oppReasoning.reasoning
          opp.key_selling_points = oppReasoning.key_selling_points
          opp.target_buyer_profile = oppReasoning.target_buyer_profile
        }
      }
    }
  }

  // 7. Store opportunities in database
  if (topOpportunities.length > 0) {
    await admin.from("sales_opportunities").upsert(
      topOpportunities.map(opp => ({
        ...opp,
        id: undefined, // Let DB generate
      })),
      { onConflict: "workspace_id, project_name, computed_at" }
    )
  }

  return {
    opportunities: topOpportunities,
    market_summary: marketSummary,
    generated_at: new Date().toISOString(),
  }
}

interface AIReasoningResult {
  marketSummary: string
  opportunities: {
    project_name: string
    reasoning: string
    key_selling_points: string[]
    target_buyer_profile: string
  }[]
}

async function generateAIReasoning(
  workspaceId: string,
  opportunities: SalesOpportunity[],
  commissionMap: Map<string, ProjectCommission>,
  signals: MarketSignal[]
): Promise<AIReasoningResult | null> {
  const cred = await getCredential(workspaceId, "gemini")
  if (!cred) return null

  const genAI = new GoogleGenerativeAI(cred.secret)

  const prompt = buildReasoningPrompt(opportunities, commissionMap, signals)

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      // Parse JSON from response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                        text.match(/\{[\s\S]*"marketSummary"[\s\S]*\}/)
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonStr) as AIReasoningResult
      }
    } catch (err) {
      console.warn(`AI reasoning with ${modelName} failed:`, (err as Error).message)
    }
  }

  return null
}

function buildReasoningPrompt(
  opportunities: SalesOpportunity[],
  commissionMap: Map<string, ProjectCommission>,
  signals: MarketSignal[]
): string {
  const oppDetails = opportunities.map(opp => {
    const commission = commissionMap.get(opp.project_name.toLowerCase())
    return {
      name: opp.project_name,
      developer: opp.developer_name,
      overall_score: opp.overall_score,
      velocity_score: opp.velocity_score,
      inventory_remaining: `${opp.inventory_remaining_pct}%`,
      daily_sales: opp.daily_sales_rate,
      days_to_sellout: opp.days_to_sellout,
      commission: commission ? `${commission.base_commission_percent}% base + ${commission.early_bird_bonus_percent || 0}% early bird` : "Unknown",
      special_incentives: commission?.special_incentives || "None",
    }
  })

  const recentSignals = signals.slice(0, 10).map(s => ({
    type: s.signal_type,
    title: s.title,
    project: s.project_name,
    sentiment: s.sentiment,
    trend_change: s.trend_change_pct ? `${s.trend_change_pct}%` : null,
  }))

  return `You are an expert Dubai real estate sales advisor. Analyze these off-plan project opportunities and provide sales recommendations.

## Top Opportunities Data:
${JSON.stringify(oppDetails, null, 2)}

## Recent Market Signals:
${JSON.stringify(recentSignals, null, 2)}

## Your Task:
Generate a JSON response with:
1. A brief market summary (2-3 sentences about overall market conditions)
2. For each opportunity:
   - A compelling reason why agents should focus on this project (2-3 sentences)
   - 3-4 key selling points for buyers
   - Target buyer profile (who should agents pitch this to)

Respond ONLY with valid JSON in this format:
\`\`\`json
{
  "marketSummary": "Brief market overview...",
  "opportunities": [
    {
      "project_name": "Project Name",
      "reasoning": "Why agents should sell this...",
      "key_selling_points": ["Point 1", "Point 2", "Point 3"],
      "target_buyer_profile": "Description of ideal buyer..."
    }
  ]
}
\`\`\`

Be specific, actionable, and focus on what helps agents close deals. Mention commission rates and urgency factors.`
}

/**
 * Get cached recommendations if still valid, otherwise generate new ones.
 */
export async function getRecommendations(
  params: RecommendationRequest
): Promise<RecommendationResponse> {
  const admin = createAdminClient()
  
  // Check for valid cached recommendations
  const { data: cached } = await admin
    .from("sales_opportunities")
    .select("*")
    .eq("workspace_id", params.workspace_id)
    .gt("valid_until", new Date().toISOString())
    .order("rank", { ascending: true })
    .limit(params.limit || 5)

  if (cached && cached.length > 0) {
    return {
      opportunities: cached as SalesOpportunity[],
      market_summary: null, // Summary not cached
      generated_at: cached[0].computed_at,
    }
  }

  // Generate fresh recommendations
  return generateRecommendations(params)
}
