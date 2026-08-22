import { NextRequest, NextResponse } from "next/server"

const PDL_API_KEY = process.env.PDL_API_KEY
const PDL_IDENTIFY_URL = "https://api.peopledatalabs.com/v5/person/identify"

// GCC Country Detection Patterns
const GCC_PATTERNS = {
  // Qatar: 8 digits, starts with 3, 5, 6, 7
  QA: { code: "974", length: 8, prefixes: ["3", "5", "6", "7"] },
  // UAE: 9 digits, starts with 5
  AE: { code: "971", length: 9, prefixes: ["50", "52", "54", "55", "56", "58"] },
  // Saudi: 9 digits, starts with 5
  SA: { code: "966", length: 9, prefixes: ["50", "53", "54", "55", "56", "57", "58", "59"] },
  // Bahrain: 8 digits, starts with 3, 6
  BH: { code: "973", length: 8, prefixes: ["3", "6"] },
  // Kuwait: 8 digits, starts with 5, 6, 9
  KW: { code: "965", length: 8, prefixes: ["5", "6", "9"] },
  // Oman: 8 digits, starts with 7, 9
  OM: { code: "968", length: 8, prefixes: ["7", "9"] },
}

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
  detectedCountry?: string
}

function detectCountry(digits: string): { code: string; country: string } | null {
  const len = digits.length

  // Check if already has a country code
  for (const [country, pattern] of Object.entries(GCC_PATTERNS)) {
    if (digits.startsWith(pattern.code)) {
      const localNumber = digits.slice(pattern.code.length)
      if (localNumber.length === pattern.length) {
        return { code: pattern.code, country }
      }
    }
  }

  // Qatar: 8 digits starting with 3, 5, 6, 7
  if (len === 8 && ["3", "5", "6", "7"].includes(digits[0])) {
    // Distinguish Qatar from others by specific patterns
    // Qatar 3x = landline/mobile, 5x/6x/7x = mobile
    if (digits[0] === "3" || digits[0] === "5" || digits[0] === "6" || digits[0] === "7") {
      return { code: "974", country: "QA" }
    }
  }

  // UAE: 9 digits starting with 5
  if (len === 9 && digits.startsWith("5")) {
    const prefix = digits.slice(0, 2)
    if (GCC_PATTERNS.AE.prefixes.includes(prefix)) {
      return { code: "971", country: "AE" }
    }
  }

  // Saudi: 9 digits starting with 5 (need to differentiate from UAE)
  if (len === 9 && digits.startsWith("5")) {
    // If not UAE prefix, try Saudi
    const prefix = digits.slice(0, 2)
    if (GCC_PATTERNS.SA.prefixes.includes(prefix)) {
      return { code: "966", country: "SA" }
    }
  }

  // Bahrain: 8 digits starting with 3 or 6
  if (len === 8 && (digits.startsWith("3") || digits.startsWith("6"))) {
    // Could be Qatar or Bahrain - default to Qatar as more common
    return { code: "974", country: "QA" }
  }

  // Kuwait: 8 digits starting with 5, 6, 9
  if (len === 8 && ["5", "6", "9"].includes(digits[0])) {
    return { code: "965", country: "KW" }
  }

  // Oman: 8 digits starting with 7, 9
  if (len === 8 && (digits.startsWith("7") || digits.startsWith("9"))) {
    return { code: "968", country: "OM" }
  }

  return null
}

function normalizePhone(phone: string): { normalized: string; country: string } {
  if (!phone) return { normalized: "", country: "" }

  // Remove all non-digits except leading +
  const hasPlus = phone.trim().startsWith("+")
  let digits = phone.replace(/\D/g, "")

  if (!digits) return { normalized: "", country: "" }

  // Handle 00 international prefix
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }

  // Remove leading 0
  digits = digits.replace(/^0+/, "")

  // Check if already has a valid country code
  for (const [country, pattern] of Object.entries(GCC_PATTERNS)) {
    if (digits.startsWith(pattern.code)) {
      const localNumber = digits.slice(pattern.code.length)
      if (localNumber.length === pattern.length) {
        return { normalized: `+${digits}`, country }
      }
    }
  }

  // Try to detect country from local number
  const detected = detectCountry(digits)
  if (detected) {
    return { 
      normalized: `+${detected.code}${digits}`, 
      country: detected.country 
    }
  }

  // If already has + and looks valid, return as-is
  if (hasPlus && digits.length >= 10) {
    return { normalized: `+${digits}`, country: "Unknown" }
  }

  // Last resort: assume Qatar for 8-digit numbers (most common in your data)
  if (digits.length === 8) {
    return { normalized: `+974${digits}`, country: "QA" }
  }

  // Assume UAE for 9-digit numbers
  if (digits.length === 9) {
    return { normalized: `+971${digits}`, country: "AE" }
  }

  return { normalized: "", country: "" }
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
      const { normalized: normalizedPhone, country } = normalizePhone(contact.phone)
      const result = await enrichContact(
        contact.name,
        normalizedPhone,
        contact.phone
      )
      result.detectedCountry = country
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
