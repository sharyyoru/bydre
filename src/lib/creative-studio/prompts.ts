import { TemplateType, ContentStyle, GenieMapProject } from "./types"

export interface PromptContext {
  project: GenieMapProject
  templateType: TemplateType
  style: ContentStyle
  agentName?: string
  companyName?: string
}

const STYLE_DESCRIPTORS: Record<ContentStyle, string> = {
  luxury: "luxurious, sophisticated, exclusive, premium lifestyle",
  modern: "contemporary, sleek, innovative, cutting-edge",
  minimal: "clean, simple, elegant, understated",
  bold: "dynamic, energetic, attention-grabbing, impactful",
}

const TEMPLATE_GUIDELINES: Record<TemplateType, { maxChars: number; tone: string }> = {
  instagram_post: { 
    maxChars: 2200, 
    tone: "engaging, conversational, include emojis sparingly" 
  },
  instagram_story: { 
    maxChars: 100, 
    tone: "urgent, snappy, action-oriented" 
  },
  facebook_post: { 
    maxChars: 500, 
    tone: "informative, community-focused" 
  },
  property_flyer: { 
    maxChars: 300, 
    tone: "professional, feature-focused, scannable" 
  },
  youtube_thumbnail: { 
    maxChars: 50, 
    tone: "clickable, intriguing, bold" 
  },
  linkedin_post: { 
    maxChars: 700, 
    tone: "professional, insightful, thought-leadership" 
  },
}

function formatPrice(price: number | null): string {
  if (!price) return "Price on request"
  if (price >= 1_000_000) {
    return `AED ${(price / 1_000_000).toFixed(1)}M`
  }
  return `AED ${(price / 1000).toFixed(0)}K`
}

function formatArea(area: number | null): string {
  if (!area) return ""
  return `${area.toLocaleString()} sq ft`
}

function getBedroomSummary(unitTypes: GenieMapProject["unit_types"]): string {
  if (!unitTypes?.length) return ""
  const beds = Array.from(new Set(unitTypes.map(u => u.beds))).sort((a, b) => a - b)
  if (beds.length === 1) {
    return beds[0] === 0 ? "Studio" : `${beds[0]} Bedroom`
  }
  const min = beds[0] === 0 ? "Studio" : `${beds[0]}`
  const max = `${beds[beds.length - 1]} Bedroom`
  return `${min} - ${max}`
}

export function buildContentPrompt(context: PromptContext): string {
  const { project, templateType, style, agentName, companyName } = context
  const guidelines = TEMPLATE_GUIDELINES[templateType]
  const styleDesc = STYLE_DESCRIPTORS[style]

  const projectInfo = `
Project Name: ${project.name}
Developer: ${project.developer_name || "Premium Developer"}
Location: ${project.district_name || "Dubai"}
Status: ${project.status || "Available"}
Starting Price: ${formatPrice(project.price_min)}
${project.price_max ? `Up to: ${formatPrice(project.price_max)}` : ""}
Unit Sizes: ${formatArea(project.area_min)}${project.area_max ? ` - ${formatArea(project.area_max)}` : ""}
Bedrooms: ${getBedroomSummary(project.unit_types)}
${project.handover_date ? `Handover: ${new Date(project.handover_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}
${project.amenities?.length ? `Amenities: ${project.amenities.slice(0, 5).join(", ")}` : ""}
${project.description ? `Description: ${project.description.slice(0, 200)}...` : ""}
`.trim()

  const prompt = `You are a luxury real estate marketing copywriter in Dubai, UAE.

Generate marketing content for a ${templateType.replace(/_/g, " ")} about this off-plan property:

${projectInfo}

REQUIREMENTS:
- Style: ${styleDesc}
- Tone: ${guidelines.tone}
- Maximum length: ${guidelines.maxChars} characters for body copy
- Target audience: High-net-worth investors and homebuyers in UAE
${agentName ? `- Agent: ${agentName}` : ""}
${companyName ? `- Company: ${companyName}` : ""}

OUTPUT FORMAT (JSON):
{
  "headline": "A powerful 5-10 word headline",
  "body_copy": "The main marketing copy",
  "hashtags": ["relevant", "hashtags", "for", "social"],
  "cta": "A compelling call-to-action"
}

Generate engaging, professional content that highlights the property's best features and creates urgency. Focus on lifestyle benefits and investment potential. Do NOT use placeholder text.`

  return prompt
}

export function buildImageSelectionPrompt(
  images: string[],
  templateType: TemplateType
): string {
  const isVertical = templateType === "instagram_story"
  const isSquare = templateType === "instagram_post"
  
  return `You are selecting the best image for a ${templateType.replace(/_/g, " ")}.

Available images: ${images.length}

CRITERIA:
- ${isVertical ? "Prefer vertical orientation" : isSquare ? "Works well cropped to square" : "Prefer landscape orientation"}
- High visual impact
- Shows the property's best features
- Good lighting and composition
- Suitable for marketing materials

Return the index (0-based) of the best image as a single number.`
}
