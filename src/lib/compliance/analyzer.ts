import {
  RealEstateClassification,
  ProjectIdentification,
  AudioTranscription,
  InstagramPost,
  PostAnalysis,
  QRDetectionResult,
  ComplianceQRCode,
} from "./types"
import { detectQRCodesInImages, matchQRCodes } from "./qr-detector"

/**
 * AI-powered content analyzer for Instagram posts.
 * Uses Gemini to classify content, identify projects, and transcribe audio.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
  }[]
}

interface GenieMapProject {
  id: string
  name: string
  developer_name: string | null
  district_name: string | null
}

/**
 * Classify if a post is about real estate
 */
export async function classifyRealEstateContent(
  caption: string | null,
  imageUrls: string[],
  geminiApiKey: string
): Promise<RealEstateClassification> {
  const prompt = `Analyze this Instagram post to determine if it's promoting a REAL ESTATE property or development project.

Caption: "${caption || "(no caption)"}"

Consider:
- Is this about buying, selling, or renting property?
- Does it mention a specific development, tower, villa, apartment, or building?
- Are there real estate keywords like "handover", "off-plan", "developer", "ROI", "payment plan"?
- Does the visual content show property interiors, exteriors, floor plans, or construction?

Return JSON only:
{
  "is_real_estate": true or false,
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`

  try {
    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [
      { text: prompt }
    ]

    // Add first image if available
    if (imageUrls.length > 0) {
      try {
        const imageRes = await fetch(imageUrls[0])
        if (imageRes.ok) {
          const imageBuffer = await imageRes.arrayBuffer()
          const base64Image = Buffer.from(imageBuffer).toString("base64")
          const mimeType = imageRes.headers.get("content-type") || "image/jpeg"
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          })
        }
      } catch {
        // Continue without image
      }
    }

    const response = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    })

    if (!response.ok) {
      return { is_real_estate: false, confidence: 0, reasoning: "API error" }
    }

    const json: GeminiResponse = await response.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { is_real_estate: false, confidence: 0, reasoning: "Parse error" }
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Classification error:", error)
    return { is_real_estate: false, confidence: 0, reasoning: "Error" }
  }
}

/**
 * Identify which project is being promoted
 */
export async function identifyProject(
  caption: string | null,
  imageUrls: string[],
  projects: GenieMapProject[],
  geminiApiKey: string
): Promise<ProjectIdentification> {
  // Build project list for matching
  const projectList = projects
    .slice(0, 50) // Limit to avoid token overflow
    .map(p => `- ID: ${p.id}, Name: "${p.name}", Developer: "${p.developer_name || "Unknown"}", Location: "${p.district_name || "Unknown"}"`)
    .join("\n")

  const prompt = `Given this Instagram post about real estate, identify which specific project is being promoted.

Caption: "${caption || "(no caption)"}"

Available projects in our database:
${projectList}

Match the post to a project based on:
- Exact or partial project name matches
- Developer name mentions
- Location/district mentions
- Visual cues if recognizable

Return JSON only:
{
  "project_id": "uuid from the list, or null if no match",
  "project_name": "name of matched project, or null",
  "confidence": 0.0 to 1.0,
  "matched_keywords": ["keywords that matched"]
}`

  try {
    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [
      { text: prompt }
    ]

    // Add first image if available
    if (imageUrls.length > 0) {
      try {
        const imageRes = await fetch(imageUrls[0])
        if (imageRes.ok) {
          const imageBuffer = await imageRes.arrayBuffer()
          const base64Image = Buffer.from(imageBuffer).toString("base64")
          const mimeType = imageRes.headers.get("content-type") || "image/jpeg"
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          })
        }
      } catch {
        // Continue without image
      }
    }

    const response = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    })

    if (!response.ok) {
      return { project_id: null, project_name: null, confidence: 0, matched_keywords: [] }
    }

    const json: GeminiResponse = await response.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { project_id: null, project_name: null, confidence: 0, matched_keywords: [] }
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Project identification error:", error)
    return { project_id: null, project_name: null, confidence: 0, matched_keywords: [] }
  }
}

/**
 * Transcribe audio from video and extract project mentions
 */
export async function transcribeAndAnalyze(
  videoUrl: string,
  projects: GenieMapProject[],
  geminiApiKey: string
): Promise<AudioTranscription | null> {
  // For MVP, we'll use a simplified approach
  // Full implementation would download audio and use Whisper or Gemini audio
  
  const prompt = `If this video has audio/speech, transcribe what is being said and identify any real estate project mentions.

Available projects: ${projects.slice(0, 20).map(p => p.name).join(", ")}

Return JSON:
{
  "transcript": "full transcription",
  "language": "detected language",
  "confidence": 0.0 to 1.0,
  "project_mentions": ["project names mentioned"]
}

If no audio or unable to process, return null.`

  try {
    // Note: Full implementation would fetch video and process audio
    // For now, return null as video processing requires additional setup
    console.log(`Audio transcription not yet implemented for: ${videoUrl} (key: ${geminiApiKey ? "present" : "missing"})`)
    console.log(`Prompt prepared: ${prompt.slice(0, 100)}...`)
    return null
  } catch (error) {
    console.error("Transcription error:", error)
    return null
  }
}

/**
 * Full post analysis pipeline
 */
export async function analyzePost(
  post: InstagramPost,
  imageUrls: string[],
  projects: GenieMapProject[],
  registeredQRCodes: ComplianceQRCode[],
  geminiApiKey: string
): Promise<PostAnalysis> {
  const startTime = Date.now()
  
  // Step 1: Classify as real estate
  const classification = await classifyRealEstateContent(
    post.caption,
    imageUrls,
    geminiApiKey
  )
  
  // If not real estate, skip further analysis
  if (!classification.is_real_estate) {
    return {
      classification,
      project: null,
      qr_detection: { qr_codes: [], images_analyzed: 0 },
      transcription: null,
      processing_time_ms: Date.now() - startTime,
    }
  }
  
  // Step 2: Identify project
  const project = await identifyProject(
    post.caption,
    imageUrls,
    projects,
    geminiApiKey
  )
  
  // Step 3: Detect QR codes
  const { allQRCodes, imagesAnalyzed } = await detectQRCodesInImages(
    imageUrls,
    geminiApiKey
  )
  
  // Match detected QR codes against registered ones
  const matchedQRCodes = matchQRCodes(allQRCodes, registeredQRCodes)
  
  const qr_detection: QRDetectionResult = {
    qr_codes: matchedQRCodes,
    images_analyzed: imagesAnalyzed,
  }
  
  // Step 4: Transcribe audio if video
  let transcription: AudioTranscription | null = null
  if (post.media_type === "VIDEO" || post.media_type === "REELS") {
    if (post.media_url) {
      transcription = await transcribeAndAnalyze(
        post.media_url,
        projects,
        geminiApiKey
      )
    }
  }
  
  return {
    classification,
    project,
    qr_detection,
    transcription,
    processing_time_ms: Date.now() - startTime,
  }
}

/**
 * Get all image URLs from a post (including carousel children)
 */
export function getPostImageUrls(post: InstagramPost & { children?: { media_url?: string }[] }): string[] {
  const urls: string[] = []
  
  if (post.media_url) {
    urls.push(post.media_url)
  }
  
  if (post.thumbnail_url && !urls.includes(post.thumbnail_url)) {
    urls.push(post.thumbnail_url)
  }
  
  // Add carousel children
  if (post.children) {
    for (const child of post.children) {
      if (child.media_url && !urls.includes(child.media_url)) {
        urls.push(child.media_url)
      }
    }
  }
  
  return urls
}
