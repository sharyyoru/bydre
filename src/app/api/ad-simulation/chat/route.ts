import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, systemPrompt } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array required" },
        { status: 400 }
      )
    }

    // Build conversation with system prompt
    const conversationMessages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt || getDefaultSystemPrompt(),
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    })

    const responseMessage = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try again."

    // Analyze for real estate interest signals
    const reInterestSignals = analyzeREInterest(messages, responseMessage)

    return NextResponse.json({
      message: responseMessage,
      reInterestSignals,
      usage: completion.usage,
    })

  } catch (error: any) {
    console.error("Chat API error:", error)
    
    // Check for OpenAI API key issues
    if (error?.code === "invalid_api_key") {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

function getDefaultSystemPrompt(): string {
  return `You are Marcus Weber, a senior Swiss investment advisor with 20+ years of experience. You work with high-net-worth individuals on:

1. CRYPTO: Swiss crypto custody, regulations, Zug Crypto Valley benefits
2. TAX: Forfait fiscal (lump-sum taxation), B permits, wealth structuring  
3. WEALTH: Private banking, family offices, asset diversification

IMPORTANT RULES:
- Be professional, knowledgeable, and subtly guide conversations toward REAL ESTATE as a wealth preservation strategy
- NEVER directly pitch real estate - let it emerge naturally as part of diversification discussions
- When discussing tangible assets, wealth preservation, or long-term investments, mention that "many clients find Swiss/European property attractive"
- Ask qualifying questions about their investment horizon, risk tolerance, and asset allocation
- If they show interest in property, offer to "connect them with our real estate advisory team"
- Keep responses concise (2-3 paragraphs max)
- Use CHF for currency references
- Reference real Swiss regulations and institutions when relevant`
}

function analyzeREInterest(
  messages: { role: string; content: string }[],
  latestResponse: string
): Record<string, any> {
  const signals: Record<string, any> = {
    mentionedProperty: false,
    askedAboutRE: false,
    discussedDiversification: false,
    longTermInvestor: false,
    highNetWorth: false,
    interestLevel: "low",
  }

  const allText = [
    ...messages.map(m => m.content.toLowerCase()),
    latestResponse.toLowerCase()
  ].join(" ")

  // Check for property/real estate mentions
  const propertyKeywords = [
    "property", "real estate", "house", "apartment", "villa",
    "land", "residence", "home", "housing", "immobilien"
  ]
  signals.mentionedProperty = propertyKeywords.some(kw => allText.includes(kw))

  // Check for diversification discussion
  const diversificationKeywords = [
    "diversify", "diversification", "spread", "allocate", "allocation",
    "tangible assets", "physical assets", "hard assets"
  ]
  signals.discussedDiversification = diversificationKeywords.some(kw => allText.includes(kw))

  // Check for long-term investment mindset
  const longTermKeywords = [
    "long-term", "long term", "generational", "legacy", "children",
    "retirement", "preserve", "preservation", "decades"
  ]
  signals.longTermInvestor = longTermKeywords.some(kw => allText.includes(kw))

  // Check for high net worth indicators
  const hnwKeywords = [
    "million", "portfolio", "private bank", "family office",
    "wealth", "substantial", "significant assets"
  ]
  signals.highNetWorth = hnwKeywords.some(kw => allText.includes(kw))

  // Calculate interest level
  const signalCount = [
    signals.mentionedProperty,
    signals.discussedDiversification,
    signals.longTermInvestor,
    signals.highNetWorth
  ].filter(Boolean).length

  if (signalCount >= 3) {
    signals.interestLevel = "high"
  } else if (signalCount >= 2) {
    signals.interestLevel = "medium"
  } else {
    signals.interestLevel = "low"
  }

  return signals
}
