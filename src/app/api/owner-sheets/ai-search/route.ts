import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCredential } from "@/lib/social-monitor/credentials"

const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"]

// Standard POST for non-streaming
export async function POST(request: NextRequest) {
  try {
    const { query, workspaceId, stream } = await request.json()

    if (!query || !workspaceId) {
      return NextResponse.json({ error: "query and workspaceId required", code: "invalid_request" }, { status: 400 })
    }

    // Get Gemini credentials
    const cred = await getCredential(workspaceId, "gemini")
    if (!cred) {
      return NextResponse.json({ 
        error: "Gemini API not configured. Add your API key in Workspace Settings → API Keys.", 
        code: "no_credentials" 
      }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(cred.secret)

    const prompt = `You are a filter translator for a property owner contact database. 
Convert the user's natural language query into filter parameters.

Available filter fields:
- area: string (e.g., "Dubai Marina", "JBR", "Downtown", "Business Bay", "Palm Jumeirah")
- building: string (e.g., "Marina Tower", "Princess Tower", "Burj Khalifa")  
- owner_type: string (e.g., "Individual", "Company", "Developer")
- nationality: string (e.g., "UAE", "Indian", "British", "Pakistani", "Russian")
- duplicatesOnly: boolean (true if user wants to see duplicates)
- search: string (for name/phone/email text search)

User query: "${query}"

Respond with a JSON object containing:
1. "filters": the filter parameters to apply
2. "interpretation": a brief human-readable explanation of what you understood

Examples:

Query: "Find all owners in Dubai Marina"
Response: {"filters": {"area": "Dubai Marina"}, "interpretation": "Showing owners in Dubai Marina"}

Query: "Show me Indian owners in JBR with duplicates"
Response: {"filters": {"area": "JBR", "nationality": "Indian", "duplicatesOnly": true}, "interpretation": "Showing Indian owners in JBR who have duplicate entries"}

Query: "Search for John"
Response: {"filters": {"search": "John"}, "interpretation": "Searching for contacts named John"}

Query: "Companies in Downtown"
Response: {"filters": {"area": "Downtown", "owner_type": "Company"}, "interpretation": "Showing company owners in Downtown"}

Now respond with ONLY the JSON for the query above:`

    // If streaming requested, use SSE
    if (stream) {
      return handleStreamingRequest(genAI, prompt, query)
    }

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

        const parsed = JSON.parse(cleaned)
        const filters = parsed.filters || parsed
        const interpretation = parsed.interpretation || `Applied filters for: "${query}"`

        return NextResponse.json({ filters, interpretation, model: modelName })
      } catch (err) {
        lastError = err as Error
        const errMsg = (err as Error).message || ""
        console.warn(`Model ${modelName} failed:`, errMsg)
        
        // Check for specific error types
        if (errMsg.includes("API key")) {
          return NextResponse.json({ 
            error: "Invalid Gemini API key. Please check your API key in settings.", 
            code: "invalid_key" 
          }, { status: 401 })
        }
        if (errMsg.includes("quota") || errMsg.includes("rate")) {
          return NextResponse.json({ 
            error: "API quota exceeded. Please try again later.", 
            code: "quota_exceeded" 
          }, { status: 429 })
        }
      }
    }

    throw lastError || new Error("All models failed")
  } catch (error) {
    console.error("AI search error:", error)
    return NextResponse.json({ 
      error: "AI search failed. Please try rephrasing your query.", 
      code: "ai_error" 
    }, { status: 500 })
  }
}

// Streaming response handler
async function handleStreamingRequest(
  genAI: GoogleGenerativeAI, 
  prompt: string,
  query: string
) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const modelName of FALLBACK_MODELS) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName })
            const result = await model.generateContentStream(prompt)
            
            let fullText = ""
            
            for await (const chunk of result.stream) {
              const text = chunk.text()
              fullText += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`))
            }
            
            // Parse final result
            const cleaned = fullText
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim()
            
            try {
              const parsed = JSON.parse(cleaned)
              const filters = parsed.filters || parsed
              const interpretation = parsed.interpretation || `Applied filters for: "${query}"`
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: "done", 
                filters, 
                interpretation,
                model: modelName 
              })}\n\n`))
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: "error", 
                error: "Could not parse AI response" 
              })}\n\n`))
            }
            
            controller.close()
            return
          } catch (err) {
            console.warn(`Stream model ${modelName} failed:`, (err as Error).message)
          }
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "All AI models failed" 
        })}\n\n`))
        controller.close()
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: "error", 
          error: "Stream failed" 
        })}\n\n`))
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
