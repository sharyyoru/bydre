import { ArbitrageOpportunity, MarketMetric, SentimentMetric } from "./types"

/**
 * Compute "Quiet Performers": areas with strong market performance (high transaction
 * value/volume/ROI) but low social sentiment (low search volume/velocity/engagement).
 *
 * Both dimensions are normalized to 0..100 percentile-style scores. The arbitrage score
 * rewards high market strength and low sentiment: score = market_strength * (100 - sentiment).
 */
export function computeArbitrage(
  market: MarketMetric[],
  sentiment: SentimentMetric[]
): ArbitrageOpportunity[] {
  if (!market.length) return []

  // Market strength = blend of total value, transaction count, and ROI (each normalized).
  const totals = market.map((m) => m.total_value_aed)
  const counts = market.map((m) => m.transaction_count)
  const rois = market.map((m) => m.roi_percent ?? 0)

  const norm = (value: number, arr: number[]) => {
    const min = Math.min(...arr)
    const max = Math.max(...arr)
    if (max === min) return 50
    return ((value - min) / (max - min)) * 100
  }

  // Sentiment index per area keyword: match by keyword contained in area name (loose).
  const sentimentByKeyword = new Map<string, SentimentMetric[]>()
  for (const s of sentiment) {
    const key = s.keyword.toLowerCase()
    const list = sentimentByKeyword.get(key) || []
    list.push(s)
    sentimentByKeyword.set(key, list)
  }

  const allEngagement = sentiment
    .map((s) => s.engagement_score ?? 0)
    .filter((n) => n > 0)
  const allVolume = sentiment
    .map((s) => s.search_volume ?? 0)
    .filter((n) => n > 0)

  const findSentimentForArea = (
    area: string
  ): { level: number; metric: SentimentMetric | null } => {
    const areaLower = area.toLowerCase()
    let matched: SentimentMetric | null = null
    for (const [key, list] of Array.from(sentimentByKeyword.entries())) {
      if (areaLower.includes(key) || key.includes(areaLower)) {
        matched = list[0]
        break
      }
    }
    if (!matched) return { level: 0, metric: null }
    const volScore = allVolume.length
      ? norm(matched.search_volume ?? 0, allVolume)
      : 0
    const engScore = allEngagement.length
      ? norm(matched.engagement_score ?? 0, allEngagement)
      : 0
    const level = Math.round((volScore + engScore) / (volScore && engScore ? 2 : 1) || 0)
    return { level, metric: matched }
  }

  return market
    .map((m) => {
      const valueScore = norm(m.total_value_aed, totals)
      const countScore = norm(m.transaction_count, counts)
      const roiScore = norm(m.roi_percent ?? 0, rois)
      const marketStrength = Math.round(
        valueScore * 0.4 + countScore * 0.3 + roiScore * 0.3
      )
      const { level: sentimentLevel, metric } = findSentimentForArea(m.area_name)
      const arbitrageScore = Math.round(
        (marketStrength * (100 - sentimentLevel)) / 100
      )
      return {
        area_name: m.area_name,
        registration_type: m.registration_type,
        market_strength: marketStrength,
        sentiment_level: sentimentLevel,
        arbitrage_score: arbitrageScore,
        total_value_aed: m.total_value_aed,
        transaction_count: m.transaction_count,
        roi_percent: m.roi_percent,
        matched_keyword: metric?.keyword ?? null,
        market_metric_id: m.id,
        sentiment_metric_id: metric?.id ?? null,
      } as ArbitrageOpportunity
    })
    .sort((a, b) => b.arbitrage_score - a.arbitrage_score)
}
