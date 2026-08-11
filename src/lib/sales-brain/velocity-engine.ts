// Inventory Velocity Engine
// Calculates sales rates, predicts sellout dates, and scores projects

import { createAdminClient } from "@/lib/supabase/admin"
import { VelocityMetrics, InventorySnapshot } from "./types"

export interface VelocityCalculationParams {
  workspaceId: string
  projectId?: string
  projectName?: string
  lookbackDays?: number // Default 30
}

/**
 * Calculate velocity metrics for a project based on inventory snapshots.
 * Returns daily/weekly sales rates, predicted sellout date, and velocity score.
 */
export async function calculateVelocity(
  params: VelocityCalculationParams
): Promise<VelocityMetrics | null> {
  const { workspaceId, projectId, projectName, lookbackDays = 30 } = params
  const admin = createAdminClient()

  // Fetch snapshots for the lookback period
  const lookbackDate = new Date()
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays)

  let query = admin
    .from("inventory_snapshots")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("snapshot_date", lookbackDate.toISOString().split("T")[0])
    .order("snapshot_date", { ascending: true })

  if (projectId) {
    query = query.eq("project_id", projectId)
  } else if (projectName) {
    query = query.eq("project_name", projectName)
  } else {
    return null // Need either projectId or projectName
  }

  const { data: snapshots, error } = await query

  if (error || !snapshots || snapshots.length < 2) {
    // Need at least 2 snapshots to calculate velocity
    return null
  }

  const typedSnapshots = snapshots as InventorySnapshot[]

  // Calculate daily changes
  const dailyChanges: { date: string; available_units: number; sold_since_last: number }[] = []
  
  for (let i = 1; i < typedSnapshots.length; i++) {
    const prev = typedSnapshots[i - 1]
    const curr = typedSnapshots[i]
    
    const prevAvailable = prev.available_units || 0
    const currAvailable = curr.available_units || 0
    const soldSinceLast = Math.max(0, prevAvailable - currAvailable)
    
    dailyChanges.push({
      date: curr.snapshot_date,
      available_units: currAvailable,
      sold_since_last: soldSinceLast,
    })
  }

  // Calculate average daily sales rate
  const totalSold = dailyChanges.reduce((sum, d) => sum + d.sold_since_last, 0)
  const daysCovered = dailyChanges.length
  const dailySalesRate = daysCovered > 0 ? totalSold / daysCovered : 0
  const weeklySalesRate = dailySalesRate * 7

  // Get latest snapshot for current inventory
  const latestSnapshot = typedSnapshots[typedSnapshots.length - 1]
  const currentAvailable = latestSnapshot.available_units || 0
  const totalUnits = latestSnapshot.total_units || currentAvailable
  const inventoryRemainingPct = totalUnits > 0 ? (currentAvailable / totalUnits) * 100 : 100

  // Predict days to sellout
  const daysToSellout = dailySalesRate > 0 
    ? Math.ceil(currentAvailable / dailySalesRate) 
    : null

  // Determine trend (last 7 days vs previous 7 days)
  let trend: "accelerating" | "stable" | "decelerating" = "stable"
  if (dailyChanges.length >= 14) {
    const recent7 = dailyChanges.slice(-7)
    const previous7 = dailyChanges.slice(-14, -7)
    
    const recentAvg = recent7.reduce((s, d) => s + d.sold_since_last, 0) / 7
    const previousAvg = previous7.reduce((s, d) => s + d.sold_since_last, 0) / 7
    
    if (recentAvg > previousAvg * 1.2) {
      trend = "accelerating"
    } else if (recentAvg < previousAvg * 0.8) {
      trend = "decelerating"
    }
  }

  // Calculate velocity score (0-100)
  // Higher score = faster selling + lower inventory
  const velocityScore = calculateVelocityScore({
    dailySalesRate,
    inventoryRemainingPct,
    daysToSellout,
    trend,
  })

  return {
    project_id: projectId || latestSnapshot.project_id || "",
    project_name: projectName || latestSnapshot.project_name,
    daily_sales_rate: Math.round(dailySalesRate * 100) / 100,
    weekly_sales_rate: Math.round(weeklySalesRate * 100) / 100,
    inventory_remaining_pct: Math.round(inventoryRemainingPct * 10) / 10,
    days_to_sellout: daysToSellout,
    velocity_score: velocityScore,
    trend,
    snapshots: dailyChanges,
  }
}

/**
 * Calculate velocity score based on multiple factors.
 * Score ranges from 0 (slow/stagnant) to 100 (hot/almost sold out).
 */
function calculateVelocityScore(params: {
  dailySalesRate: number
  inventoryRemainingPct: number
  daysToSellout: number | null
  trend: "accelerating" | "stable" | "decelerating"
}): number {
  const { dailySalesRate, inventoryRemainingPct, daysToSellout, trend } = params

  let score = 0

  // Daily sales rate component (0-40 points)
  // > 5 units/day = 40, 3-5 = 30, 1-3 = 20, 0.5-1 = 10, < 0.5 = 5
  if (dailySalesRate >= 5) score += 40
  else if (dailySalesRate >= 3) score += 30
  else if (dailySalesRate >= 1) score += 20
  else if (dailySalesRate >= 0.5) score += 10
  else if (dailySalesRate > 0) score += 5

  // Scarcity component (0-30 points)
  // < 10% remaining = 30, 10-25% = 25, 25-50% = 15, 50-75% = 10, > 75% = 5
  if (inventoryRemainingPct < 10) score += 30
  else if (inventoryRemainingPct < 25) score += 25
  else if (inventoryRemainingPct < 50) score += 15
  else if (inventoryRemainingPct < 75) score += 10
  else score += 5

  // Urgency component based on sellout prediction (0-20 points)
  if (daysToSellout !== null) {
    if (daysToSellout <= 30) score += 20
    else if (daysToSellout <= 60) score += 15
    else if (daysToSellout <= 90) score += 10
    else if (daysToSellout <= 180) score += 5
  }

  // Trend component (0-10 points)
  if (trend === "accelerating") score += 10
  else if (trend === "stable") score += 5
  // decelerating = 0

  return Math.min(100, Math.round(score))
}

/**
 * Get top projects by velocity score.
 */
export async function getTopVelocityProjects(
  workspaceId: string,
  limit: number = 10
): Promise<VelocityMetrics[]> {
  const admin = createAdminClient()

  // Get all unique projects with recent snapshots
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: projects } = await admin
    .from("inventory_snapshots")
    .select("project_id, project_name")
    .eq("workspace_id", workspaceId)
    .gte("snapshot_date", thirtyDaysAgo.toISOString().split("T")[0])

  if (!projects || projects.length === 0) {
    return []
  }

  // Get unique projects
  const uniqueProjects = new Map<string, string>()
  for (const p of projects) {
    const key = p.project_id || p.project_name
    if (key && !uniqueProjects.has(key)) {
      uniqueProjects.set(key, p.project_name)
    }
  }

  // Calculate velocity for each
  const velocities: VelocityMetrics[] = []
  const entries = Array.from(uniqueProjects.entries())
  for (const [projectId, projectName] of entries) {
    const velocity = await calculateVelocity({
      workspaceId,
      projectId: projectId.includes("-") ? projectId : undefined,
      projectName: !projectId.includes("-") ? projectName : undefined,
    })
    if (velocity) {
      velocities.push(velocity)
    }
  }

  // Sort by velocity score descending
  velocities.sort((a, b) => b.velocity_score - a.velocity_score)

  return velocities.slice(0, limit)
}

/**
 * Create an inventory snapshot from current GenieMap or scraper data.
 */
export async function createInventorySnapshot(params: {
  workspaceId: string
  projectId?: string
  projectName: string
  totalUnits: number
  availableUnits: number
  soldUnits?: number
  avgPrice?: number
  minPrice?: number
  maxPrice?: number
  source: string
  rawData?: Record<string, unknown>
}): Promise<void> {
  const admin = createAdminClient()

  const soldUnits = params.soldUnits ?? (params.totalUnits - params.availableUnits)

  await admin.from("inventory_snapshots").upsert(
    {
      workspace_id: params.workspaceId,
      project_id: params.projectId || null,
      project_name: params.projectName,
      snapshot_date: new Date().toISOString().split("T")[0],
      total_units: params.totalUnits,
      available_units: params.availableUnits,
      sold_units: soldUnits,
      reserved_units: 0,
      avg_price_aed: params.avgPrice || null,
      min_price_aed: params.minPrice || null,
      max_price_aed: params.maxPrice || null,
      source: params.source,
      raw_data: params.rawData || null,
    },
    {
      onConflict: "workspace_id, project_id, snapshot_date",
    }
  )
}
