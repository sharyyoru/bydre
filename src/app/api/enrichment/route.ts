import { NextRequest, NextResponse } from "next/server"

const PDL_API_KEY = process.env.PDL_API_KEY
const PDL_IDENTIFY_URL = "https://api.peopledatalabs.com/v5/person/identify"

// UAE mobile prefixes
const UAE_MOBILE_PREFIXES = ["50", "52", "54", "55", "56", "58"]

interface EnrichedContact {
  name: string
  phone: string
  originalPhone: string
  email: string | null
  linkedinUrl: string | null
  jobTitle: string | null
  company: string | null
  confidence: number | null
  error: string | null
}

function normalizePhone(phone: string): string {
  if (!phone) return ""

  // Remove all non-digits except leading +
  const hasPlus = phone.trim().startsWith("+")
  let digits = phone.replace(/\D/g, "")

  if (!digits) return ""

  // Handle 00 international prefix
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }

  // Check if already has UAE country code
  if (digits.startsWith("971") && digits.length === 12) {
    return `+${digits}`
  }

  // Remove leading 0
  digits = digits.replace(/^0+/, "")

  // If 9 digits starting with 5, it's UAE mobile
  if (digits.length === 9 && UAE_MOBILE_PREFIXES.includes(digits.slice(0, 2))) {
    return `+971${digits}`
  }

  // If already has + and looks valid, return as-is
  if (hasPlus && digits.length >= 10) {
    return `+${digits}`
  }

  // Default: try to make it UAE
  if (digits.length === 9 && digits.startsWith("5")) {
    return `+971${digits}`
  }

  return ""
}

async function enrichContact(
  name: string,
  phone: string,
  originalPhone: string
): Promise<EnrichedContact> {
  if (!name || !phone) {
    return {
      name,
      phone,
      originalPhone,
      email: null,
      linkedinUrl: null,
      jobTitle: null,
      company: null,
      confidence: null,
      error: !phone ? "Invalid phone number" : "Missing name",
    }
  }

  try {
    const response = await fetch(PDL_IDENTIFY_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": PDL_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        name,
        min_likelihood: 2,
      }),
    })

    if (response.status === 429) {
      return {
        name,
        phone,
        originalPhone,
        email: null,
        linkedinUrl: null,
        jobTitle: null,
        company: null,
        confidence: null,
        error: "Rate limit exceeded - try again later",
      }
    }

    if (response.status === 404) {
      return {
        name,
        phone,
        originalPhone,
        email: null,
        linkedinUrl: null,
        jobTitle: null,
        company: null,
        confidence: null,
        error: "No match found",
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        name,
        phone,
        originalPhone,
        email: null,
        linkedinUrl: null,
        jobTitle: null,
        company: null,
        confidence: null,
        error: errorData?.error?.message || `API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const matches = data.matches || []

    if (matches.length === 0) {
      return {
        name,
        phone,
        originalPhone,
        email: null,
        linkedinUrl: null,
        jobTitle: null,
        company: null,
        confidence: null,
        error: "No matches found",
      }
    }

    const bestMatch = matches[0]
    const personData = bestMatch.data || {}

    // Get email (prefer work, then personal)
    let email = personData.work_email || null
    if (!email && personData.personal_emails?.length > 0) {
      email = personData.personal_emails[0]
    }

    return {
      name,
      phone,
      originalPhone,
      email,
      linkedinUrl: personData.linkedin_url || null,
      jobTitle: personData.job_title || null,
      company: personData.job_company_name || null,
      confidence: bestMatch.match_score || null,
      error: null,
    }
  } catch (error) {
    return {
      name,
      phone,
      originalPhone,
      email: null,
      linkedinUrl: null,
      jobTitle: null,
      company: null,
      confidence: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function POST(request: NextRequest) {
  if (!PDL_API_KEY) {
    return NextResponse.json(
      { error: "PDL API key not configured" },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Parse CSV
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have header row and at least one data row" },
        { status: 400 }
      )
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const nameIdx = header.findIndex((h) =>
      ["name", "full_name", "contact_name"].includes(h)
    )
    const phoneIdx = header.findIndex((h) =>
      ["phone", "phone_number", "mobile", "telephone"].includes(h)
    )

    if (nameIdx === -1 || phoneIdx === -1) {
      return NextResponse.json(
        {
          error:
            "CSV must have Name and Phone_Number columns (or similar: full_name, mobile, telephone)",
        },
        { status: 400 }
      )
    }

    // Parse rows
    const contacts: { name: string; phone: string }[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
      if (cols[nameIdx] && cols[phoneIdx]) {
        contacts.push({
          name: cols[nameIdx],
          phone: cols[phoneIdx],
        })
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found in CSV" },
        { status: 400 }
      )
    }

    // Enrich contacts (with rate limiting)
    const results: EnrichedContact[] = []
    const RATE_LIMIT_MS = 150 // ~7 requests per second

    for (const contact of contacts) {
      const normalizedPhone = normalizePhone(contact.phone)
      const result = await enrichContact(
        contact.name,
        normalizedPhone,
        contact.phone
      )
      results.push(result)

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS))
    }

    // Calculate stats
    const enriched = results.filter((r) => r.email || r.linkedinUrl).length
    const failed = results.filter((r) => r.error && r.error !== "No match found").length
    const noMatch = results.filter((r) => r.error === "No match found").length

    return NextResponse.json({
      success: true,
      stats: {
        total: results.length,
        enriched,
        failed,
        noMatch,
        successRate: ((enriched / results.length) * 100).toFixed(1),
      },
      results,
    })
  } catch (error) {
    console.error("Enrichment error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    )
  }
}
