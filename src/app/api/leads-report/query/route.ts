import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  try {
    const { query, data, context } = await req.json()
    
    if (!query || !data) {
      return NextResponse.json({ error: "Missing query or data" }, { status: 400 })
    }

    const systemPrompt = `You are an expert data analyst helping analyze lead performance data for a real estate company. You have access to Excel data containing campaign performance metrics.

The data includes:
- Campaign performance by vendors and lead status
- Lead owner performance metrics
- Various lead statuses: Call Back, Fresh Lead, Information Shared, Interested, Invalid/Wrong Number, Language Barrier, Meeting Scheduled, Meeting Done, Mistake Inquiry, No Answer/Busy, Not Qualified, Postponed/Purchased, Switched Off, etc.

When analyzing data:
1. Provide clear, actionable insights
2. Calculate percentages and comparisons when relevant
3. Highlight top and bottom performers
4. Identify trends and patterns
5. Make recommendations based on the data
6. Use tables and bullet points for clarity
7. Be concise but thorough

Format your response in markdown for readability.`

    const dataContext = `Here is the current data context:\n${JSON.stringify(data, null, 2)}\n\n${context || ""}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${dataContext}\n\nUser Question: ${query}` }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const answer = response.choices[0]?.message?.content || "Unable to generate response"

    return NextResponse.json({ answer })
  } catch (error) {
    console.error("AI Query error:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
