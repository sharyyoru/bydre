import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCredential } from "@/lib/social-monitor/credentials"

const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"]

export async function POST(request: NextRequest) {
  try {
    const { query, workspaceId } = await request.json()

    if (!query || !workspaceId) {
      return NextResponse.json({ error: "query and workspaceId required" }, { status: 400 })
    }

    // Get Gemini credentials
    const cred = await getCredential(workspaceId, "gemini")
    if (!cred) {
      return NextResponse.json({ error: "Gemini API not configured" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(cred.secret)

    const prompt = `You are a filter translator for a property owner contact database. 
Convert the user's natural language query into filter parameters.

Available filter fields:
- area: string (e.g., "Dubai Marina", "JBR", "Downtown")
- building: string (e.g., "Marina Tower", "Princess Tower")  
- owner_type: string (e.g., "Individual", "Company", "Developer")
- nationality: string (e.g., "UAE", "India", "UK")
- duplicatesOnly: boolean
- search: string (for name/phone/email search)

User query: "${query}"

Respond with ONLY a valid JSON object containing the relevant filters. 
Only include fields that the user mentioned. Examples:

Query: "Find all owners in Dubai Marina"
Response: {"area": "Dubai Marina"}

Query: "Show me Indian owners in JBR with duplicates"
Response: {"area": "JBR", "nationality": "India", "duplicatesOnly": true}

Query: "Search for John"
Response: {"search": "John"}

Query: "Companies in Downtown"
Response: {"area": "Downtown", "owner_type": "Company"}

Now respond with the filter JSON for the query above:`

    // Try models until one works
    let lastError: Error | null = null

    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // Clean up response
        const cleaned = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim()

        const filters = JSON.parse(cleaned)

        return NextResponse.json({ filters, model: modelName })
      } catch (err) {
        lastError = err as Error
        console.warn(`Model ${modelName} failed:`, (err as Error).message)
      }
    }

    throw lastError || new Error("All models failed")
  } catch (error) {
    console.error("AI search error:", error)
    return NextResponse.json({ error: "AI search failed" }, { status: 500 })
  }
}
