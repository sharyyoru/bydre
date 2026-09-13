import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCredential } from "@/lib/social-monitor/credentials"
import { createAdminClient } from "@/lib/supabase/admin"

const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]

async function resolveWorkspaceId(idOrSlug: string): Promise<string | null> {
  // If it's already a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug
  }
  // Otherwise, look up by slug
  const admin = createAdminClient()
  const { data } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", idOrSlug)
    .single()
  return data?.id || null
}

const SYSTEM_PROMPT = `You are an expert leads data analyst for a real estate company. You analyze campaign performance, lead conversion, and agent productivity data.

When analyzing data:
1. Provide clear, actionable insights
2. Calculate percentages, averages, and comparisons
3. Identify top and bottom performers
4. Highlight trends and anomalies
5. Make specific recommendations

IMPORTANT: When visualization would help explain your answer, include a chartSpec JSON block in your response.

ChartSpec format (include when helpful):
\`\`\`chartSpec
{
  "type": "bar" | "line" | "pie" | "funnel" | "area",
  "title": "Chart Title",
  "data": [{ "name": "Category", "value": 123, ... }],
  "xKey": "name",
  "yKey": "value",
  "colors": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
}
\`\`\`

Examples of when to include charts:
- "Show vendor performance" → bar chart comparing vendors
- "What's the conversion funnel?" → funnel chart
- "Leads over time" → line/area chart
- "Status distribution" → pie chart

Lead status terminology:
- Fresh Lead: New, untouched
- Call Back: Requested callback
- Information Shared: Materials sent
- Interested: Showed interest
- Meeting Scheduled: Appointment set
- Meeting Done: Completed meeting
- Not Qualified: Doesn't meet criteria
- Invalid/Wrong Number: Bad contact
- No Answer/Busy: Couldn't reach

Format your response in markdown for readability. Be concise but thorough.`

export async function POST(request: NextRequest) {
  try {
    const { query, data, workspaceId: rawWorkspaceId, context } = await request.json()

    if (!query || !rawWorkspaceId) {
      return NextResponse.json({ error: "query and workspaceId required" }, { status: 400 })
    }

    // Resolve workspace slug to UUID if needed
    const workspaceId = await resolveWorkspaceId(rawWorkspaceId)
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
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

    // Build data context
    const dataContext = data ? `
Here is the leads data you have access to:
${JSON.stringify(data, null, 2)}

${context || ""}
` : ""

    const fullPrompt = `${dataContext}

User Question: ${query}

Analyze the data and provide insights. Include a chartSpec if visualization would help.`

    // Try models until one works
    let lastError: Error | null = null

    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_PROMPT
        })
        
        const result = await model.generateContent(fullPrompt)
        const text = result.response.text()

        // Extract chartSpec if present
        let chartSpec = null
        const chartMatch = text.match(/```chartSpec\n([\s\S]*?)\n```/)
        if (chartMatch) {
          try {
            chartSpec = JSON.parse(chartMatch[1])
          } catch {
            console.warn("Failed to parse chartSpec")
          }
        }

        // Clean response (remove chartSpec block for display)
        const cleanedAnswer = text
          .replace(/```chartSpec\n[\s\S]*?\n```/g, "")
          .trim()

        return NextResponse.json({ 
          answer: cleanedAnswer, 
          chartSpec,
          model: modelName 
        })
      } catch (err) {
        lastError = err as Error
        const errMsg = (err as Error).message || ""
        console.warn(`Model ${modelName} failed:`, errMsg)
        
        if (errMsg.includes("API key")) {
          return NextResponse.json({ 
            error: "Invalid Gemini API key", 
            code: "invalid_key" 
          }, { status: 401 })
        }
        if (errMsg.includes("quota") || errMsg.includes("rate")) {
          return NextResponse.json({ 
            error: "API quota exceeded", 
            code: "quota_exceeded" 
          }, { status: 429 })
        }
      }
    }

    throw lastError || new Error("All models failed")
  } catch (error) {
    console.error("Gemini query error:", error)
    return NextResponse.json({ 
      error: "AI analysis failed. Please try again.", 
      code: "ai_error" 
    }, { status: 500 })
  }
}
