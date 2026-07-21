import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { getCredential } from "./credentials"
import {
  ArbitrageOpportunity,
  GeneratedBrief,
  NotConfiguredError,
} from "./types"
import { formatAED } from "./format"

const DEFAULT_MODEL = "gemini-2.0-flash"

const briefSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    angle: { type: SchemaType.STRING },
    hook: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    platform_copy: {
      type: SchemaType.OBJECT,
      properties: {
        instagram: { type: SchemaType.STRING },
        tiktok: { type: SchemaType.STRING },
        youtube: { type: SchemaType.STRING },
        x: { type: SchemaType.STRING },
        linkedin: { type: SchemaType.STRING },
      },
    },
    keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["title", "angle", "hook", "summary", "platform_copy", "keywords"],
} as const

async function getModel(workspaceId: string) {
  const cred = await getCredential(workspaceId, "gemini")
  if (!cred) throw new NotConfiguredError("gemini")
  const modelName = (cred.config.model as string | undefined) || DEFAULT_MODEL
  const genAI = new GoogleGenerativeAI(cred.secret)
  return { genAI, modelName }
}

/**
 * Generate a structured content brief for a given arbitrage opportunity.
 */
export async function generateBrief(
  workspaceId: string,
  opportunity: ArbitrageOpportunity
): Promise<{ brief: GeneratedBrief; model: string }> {
  const { genAI, modelName } = await getModel(workspaceId)
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: briefSchema as any,
    },
  })

  const prompt = `You are a UAE real-estate social media strategist for DreHomes.
Create a short-form content brief for a "Quiet Performer" investment opportunity.

Opportunity data:
- Area: ${opportunity.area_name}
- Registration: ${opportunity.registration_type === "off_plan" ? "Off-plan" : "Ready"}
- Total transaction value: ${formatAED(opportunity.total_value_aed)}
- Transactions: ${opportunity.transaction_count}
- ROI: ${opportunity.roi_percent != null ? opportunity.roi_percent + "%" : "n/a"}
- Market strength (0-100): ${opportunity.market_strength}
- Social sentiment level (0-100): ${opportunity.sentiment_level}
- Arbitrage score: ${opportunity.arbitrage_score}

The core insight: this area performs strongly financially but has LOW social buzz — a
first-mover content opportunity. All monetary values must be in AED. Produce a punchy
hook, a clear angle, a concise summary, platform-specific copy (instagram, tiktok,
youtube, x, linkedin), and relevant keywords.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const brief = JSON.parse(text) as GeneratedBrief
  return { brief, model: modelName }
}

/**
 * Generate a narrative explanation of the top arbitrage opportunities.
 */
export async function generateArbitrageNarrative(
  workspaceId: string,
  opportunities: ArbitrageOpportunity[]
): Promise<string> {
  const { genAI, modelName } = await getModel(workspaceId)
  const model = genAI.getGenerativeModel({ model: modelName })

  const top = opportunities.slice(0, 5)
  const lines = top
    .map(
      (o, i) =>
        `${i + 1}. ${o.area_name} (${o.registration_type}) — market ${o.market_strength}, sentiment ${o.sentiment_level}, score ${o.arbitrage_score}, value ${formatAED(o.total_value_aed)}`
    )
    .join("\n")

  const prompt = `As a UAE real-estate market analyst, explain in 3-4 sentences why these
"Quiet Performers" represent content arbitrage opportunities (strong market, low social
buzz). Then recommend one concrete content angle. Values are in AED.\n\n${lines}`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
