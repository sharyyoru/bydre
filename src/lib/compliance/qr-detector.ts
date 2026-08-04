import { DetectedQRCode, ComplianceQRCode } from "./types"

/**
 * QR Code detection using Gemini Vision API.
 * Detects and decodes QR codes from images.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
  }[]
}

/**
 * Detect QR codes in an image using Gemini Vision
 */
export async function detectQRCodesInImage(
  imageUrl: string,
  geminiApiKey: string
): Promise<DetectedQRCode[]> {
  const prompt = `Analyze this image and detect ALL QR codes present.

For each QR code found:
1. Decode the QR code content (the URL or text it contains)
2. Describe its approximate location (top-left, center, bottom-right, etc.)
3. Estimate your confidence in the reading (0.0 to 1.0)

IMPORTANT: 
- Look carefully in ALL corners and areas of the image
- QR codes may be small or partially visible
- There may be 0, 1, 2, or more QR codes

Return your response as valid JSON only:
{
  "qr_codes": [
    {
      "data": "decoded content/URL from the QR code",
      "location": "description of where in the image",
      "confidence": 0.95
    }
  ],
  "total_found": 0
}

If no QR codes are found, return: { "qr_codes": [], "total_found": 0 }`

  try {
    // Fetch image and convert to base64
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`)
      return []
    }
    
    const imageBuffer = await imageRes.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

    const response = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`)
      return []
    }

    const json: GeminiResponse = await response.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return []
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    return (parsed.qr_codes || []).map((qr: { data: string; location?: string; confidence?: number }) => ({
      data: qr.data,
      location: qr.location ? { description: qr.location } : undefined,
      confidence: qr.confidence || 0.5,
    }))
  } catch (error) {
    console.error("QR detection error:", error)
    return []
  }
}

/**
 * Detect QR codes in multiple images (for carousel posts)
 */
export async function detectQRCodesInImages(
  imageUrls: string[],
  geminiApiKey: string
): Promise<{ allQRCodes: DetectedQRCode[]; imagesAnalyzed: number }> {
  const allQRCodes: DetectedQRCode[] = []
  let imagesAnalyzed = 0
  
  for (const url of imageUrls) {
    const qrCodes = await detectQRCodesInImage(url, geminiApiKey)
    allQRCodes.push(...qrCodes)
    imagesAnalyzed++
  }
  
  // Deduplicate QR codes by data
  const uniqueQRCodes = Array.from(
    new Map(allQRCodes.map(qr => [qr.data, qr])).values()
  )
  
  return { allQRCodes: uniqueQRCodes, imagesAnalyzed }
}

/**
 * Extract frames from video for QR detection
 * Note: This is a placeholder - actual implementation would use ffmpeg or similar
 */
export async function extractVideoFrames(
  videoUrl: string,
  frameCount = 5
): Promise<string[]> {
  // For MVP, we'll use the thumbnail if available
  // Full implementation would extract frames using ffmpeg
  console.log(`Video frame extraction not yet implemented for: ${videoUrl}, frameCount: ${frameCount}`)
  return []
}

/**
 * Match detected QR codes against registered QR codes
 */
export function matchQRCodes(
  detected: DetectedQRCode[],
  registered: ComplianceQRCode[]
): DetectedQRCode[] {
  return detected.map(qr => {
    const match = registered.find(r => {
      if (!r.qr_data) return false
      // Exact match or URL contains match
      return r.qr_data === qr.data || 
             qr.data.includes(r.qr_data) || 
             r.qr_data.includes(qr.data)
    })
    
    if (match) {
      return {
        ...qr,
        matched_qr_id: match.id,
        matched_qr_type: match.type,
      }
    }
    
    return qr
  })
}

/**
 * Check if company QR is present in detected codes
 */
export function hasCompanyQR(
  detected: DetectedQRCode[],
  companyQR: ComplianceQRCode | null
): boolean {
  if (!companyQR || !companyQR.qr_data) return false
  
  const companyData = companyQR.qr_data
  return detected.some(qr => 
    qr.data === companyData ||
    qr.data.includes(companyData) ||
    companyData.includes(qr.data)
  )
}

/**
 * Check if correct project QR is present
 */
export function hasCorrectProjectQR(
  detected: DetectedQRCode[],
  projectQR: ComplianceQRCode | null
): { found: boolean; correct: boolean; foundQR?: DetectedQRCode } {
  if (!projectQR || !projectQR.qr_data) {
    return { found: false, correct: false }
  }
  
  const projectData = projectQR.qr_data
  const match = detected.find(qr =>
    qr.data === projectData ||
    qr.data.includes(projectData) ||
    projectData.includes(qr.data)
  )
  
  if (match) {
    return { found: true, correct: true, foundQR: match }
  }
  
  // Check if any project QR was found (but wrong one)
  const anyProjectQR = detected.find(qr => qr.matched_qr_type === "project")
  if (anyProjectQR) {
    return { found: true, correct: false, foundQR: anyProjectQR }
  }
  
  return { found: false, correct: false }
}
