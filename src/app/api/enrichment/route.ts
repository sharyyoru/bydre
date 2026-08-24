import { NextRequest, NextResponse } from "next/server"

const PDL_API_KEY = process.env.PDL_API_KEY
const APOLLO_API_KEY = process.env.APOLLO_API_KEY
const HUNTER_API_KEY = process.env.HUNTER_API_KEY

const PDL_ENRICH_URL = "https://api.peopledatalabs.com/v5/person/enrich"
const APOLLO_API_URL = "https://api.apollo.io/v1"
const HUNTER_API_URL = "https://api.hunter.io/v2"

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
  // Multi-provider fields
  source?: string
  providersTried?: string[]
  isVerified?: boolean
  verificationStatus?: string
  isDeliverable?: boolean
}

type Provider = "pdl" | "apollo" | "hunter"

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

async function enrichWithPDL(
  name: string,
  phone: string
): Promise<{ email: string | null; linkedinUrl: string | null; jobTitle: string | null; company: string | null; confidence: number | null; error: string | null }> {
  if (!PDL_API_KEY) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: "PDL not configured" }
  
  try {
    const params = new URLSearchParams({ phone, name, min_likelihood: "2" })
    const response = await fetch(`${PDL_ENRICH_URL}?${params.toString()}`, {
      method: "GET",
      headers: { "X-Api-Key": PDL_API_KEY },
    })

    if (response.status === 429) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: "Rate limit" }
    if (response.status === 404) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: "No match" }
    if (!response.ok) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: `API error: ${response.status}` }

    const data = await response.json()
    let email = data.work_email || null
    if (!email && data.personal_emails?.length > 0) email = data.personal_emails[0]
    if (!email && data.emails?.length > 0) email = data.emails[0].address

    return {
      email,
      linkedinUrl: data.linkedin_url || null,
      jobTitle: data.job_title || null,
      company: data.job_company_name || null,
      confidence: data.likelihood || null,
      error: null,
    }
  } catch (error) {
    return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function enrichWithApollo(
  name: string,
  company?: string,
  domain?: string
): Promise<{ email: string | null; linkedinUrl: string | null; jobTitle: string | null; company: string | null; confidence: number | null; error: string | null }> {
  if (!APOLLO_API_KEY) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: "Apollo not configured" }
  
  try {
    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const payload: Record<string, unknown> = {
      api_key: APOLLO_API_KEY,
      first_name: firstName,
      last_name: lastName,
      per_page: 1,
    }
    if (domain) payload.organization_domains = [domain]
    else if (company) payload.organization_name = company

    const response = await fetch(`${APOLLO_API_URL}/people/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.status === 429) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: "Rate limit" }
    if (!response.ok) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: `API error: ${response.status}` }

    const data = await response.json()
    const people = data.people || []
    if (people.length === 0) return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: "No match" }

    const person = people[0]
    return {
      email: person.email || null,
      linkedinUrl: person.linkedin_url || null,
      jobTitle: person.title || null,
      company: person.organization?.name || null,
      confidence: person.email ? 0.8 : 0.5,
      error: null,
    }
  } catch (error) {
    return { email: null, linkedinUrl: null, jobTitle: null, company: null, confidence: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function enrichWithHunter(
  name: string,
  domain: string
): Promise<{ email: string | null; linkedinUrl: string | null; jobTitle: string | null; confidence: number | null; error: string | null }> {
  if (!HUNTER_API_KEY || !domain) return { email: null, linkedinUrl: null, jobTitle: null, confidence: null, error: "Hunter not configured or no domain" }
  
  try {
    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: HUNTER_API_KEY,
    })

    const response = await fetch(`${HUNTER_API_URL}/email-finder?${params.toString()}`)

    if (response.status === 429) return { email: null, linkedinUrl: null, jobTitle: null, confidence: null, error: "Rate limit" }
    if (response.status === 404 || response.status === 400) return { email: null, linkedinUrl: null, jobTitle: null, confidence: null, error: "No match" }
    if (!response.ok) return { email: null, linkedinUrl: null, jobTitle: null, confidence: null, error: `API error: ${response.status}` }

    const data = await response.json()
    const result = data.data || {}
    const score = result.score || 0

    return {
      email: result.email || null,
      linkedinUrl: result.linkedin || null,
      jobTitle: result.position || null,
      confidence: score / 100,
      error: null,
    }
  } catch (error) {
    return { email: null, linkedinUrl: null, jobTitle: null, confidence: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function verifyEmailWithHunter(email: string): Promise<{ status: string; isDeliverable: boolean; score: number }> {
  if (!HUNTER_API_KEY || !email) return { status: "unknown", isDeliverable: false, score: 0 }
  
  try {
    const params = new URLSearchParams({ email, api_key: HUNTER_API_KEY })
    const response = await fetch(`${HUNTER_API_URL}/email-verifier?${params.toString()}`)

    if (!response.ok) return { status: "unknown", isDeliverable: false, score: 0 }

    const data = await response.json()
    const result = data.data || {}
    const status = result.status || "unknown"
    const score = result.score || 0
    const isDeliverable = status === "valid" || (status === "accept_all" && score >= 50)

    return { status, isDeliverable, score }
  } catch {
    return { status: "unknown", isDeliverable: false, score: 0 }
  }
}

async function enrichContact(
  name: string,
  phone: string,
  originalPhone: string,
  company?: string,
  domain?: string,
  enabledProviders: Provider[] = ["pdl", "apollo", "hunter"],
  verifyEmails: boolean = true
): Promise<EnrichedContact> {
  const result: EnrichedContact = {
    name,
    phone,
    originalPhone,
    email: null,
    linkedinUrl: null,
    jobTitle: null,
    company: company || null,
    confidence: null,
    error: null,
    source: undefined,
    providersTried: [],
    isVerified: false,
    verificationStatus: undefined,
    isDeliverable: false,
  }

  if (!name || !phone) {
    result.error = !phone ? "Invalid phone number" : "Missing name"
    return result
  }

  // Try PDL first (best for phone lookup)
  if (enabledProviders.includes("pdl") && PDL_API_KEY) {
    result.providersTried!.push("pdl")
    const pdlResult = await enrichWithPDL(name, phone)
    if (pdlResult.email) {
      result.email = pdlResult.email
      result.linkedinUrl = pdlResult.linkedinUrl
      result.jobTitle = pdlResult.jobTitle
      result.company = pdlResult.company || company || null
      result.confidence = pdlResult.confidence
      result.source = "pdl"
    }
  }

  // Try Apollo if no email yet
  if (!result.email && enabledProviders.includes("apollo") && APOLLO_API_KEY) {
    result.providersTried!.push("apollo")
    const apolloResult = await enrichWithApollo(name, company, domain)
    if (apolloResult.email) {
      result.email = apolloResult.email
      result.linkedinUrl = result.linkedinUrl || apolloResult.linkedinUrl
      result.jobTitle = result.jobTitle || apolloResult.jobTitle
      result.company = result.company || apolloResult.company
      result.confidence = apolloResult.confidence
      result.source = "apollo"
    }
  }

  // Try Hunter if no email yet and domain is available
  if (!result.email && enabledProviders.includes("hunter") && HUNTER_API_KEY && domain) {
    result.providersTried!.push("hunter")
    const hunterResult = await enrichWithHunter(name, domain)
    if (hunterResult.email) {
      result.email = hunterResult.email
      result.linkedinUrl = result.linkedinUrl || hunterResult.linkedinUrl
      result.jobTitle = result.jobTitle || hunterResult.jobTitle
      result.confidence = hunterResult.confidence
      result.source = "hunter"
    }
  }

  // Verify email if found
  if (result.email && verifyEmails && HUNTER_API_KEY) {
    const verification = await verifyEmailWithHunter(result.email)
    result.isVerified = true
    result.verificationStatus = verification.status
    result.isDeliverable = verification.isDeliverable
    // Adjust confidence based on verification
    if (verification.isDeliverable && result.confidence) {
      result.confidence = Math.min(result.confidence + 0.1, 1.0)
    } else if (verification.status === "invalid") {
      result.confidence = 0.1
      result.error = "Email undeliverable"
    }
  }

  if (!result.email && !result.linkedinUrl) {
    result.error = "No match found"
  }

  return result
}

export async function POST(request: NextRequest) {
  // Check if at least one provider is configured
  const hasAnyProvider = PDL_API_KEY || APOLLO_API_KEY || HUNTER_API_KEY
  if (!hasAnyProvider) {
    return NextResponse.json(
      { error: "No enrichment API keys configured. Set PDL_API_KEY, APOLLO_API_KEY, or HUNTER_API_KEY." },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    
    // Get options from form data
    const providersRaw = formData.get("providers") as string | null
    const verifyEmails = formData.get("verifyEmails") !== "false"
    
    // Parse enabled providers (default: all available)
    let enabledProviders: Provider[] = ["pdl", "apollo", "hunter"]
    if (providersRaw) {
      enabledProviders = providersRaw.split(",").filter((p): p is Provider => 
        ["pdl", "apollo", "hunter"].includes(p)
      )
    }

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
    const companyIdx = header.findIndex((h) =>
      ["company", "organization", "company_name"].includes(h)
    )
    const domainIdx = header.findIndex((h) =>
      ["domain", "website", "company_domain"].includes(h)
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
    const contacts: { name: string; phone: string; company?: string; domain?: string }[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
      if (cols[nameIdx] && cols[phoneIdx]) {
        contacts.push({
          name: cols[nameIdx],
          phone: cols[phoneIdx],
          company: companyIdx !== -1 ? cols[companyIdx] : undefined,
          domain: domainIdx !== -1 ? cols[domainIdx] : undefined,
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
    const RATE_LIMIT_MS = 200 // Slightly slower for multi-provider

    for (const contact of contacts) {
      const { normalized: normalizedPhone, country } = normalizePhone(contact.phone)
      const result = await enrichContact(
        contact.name,
        normalizedPhone,
        contact.phone,
        contact.company,
        contact.domain,
        enabledProviders,
        verifyEmails
      )
      result.detectedCountry = country
      results.push(result)

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS))
    }

    // Calculate stats
    const enriched = results.filter((r) => r.email || r.linkedinUrl).length
    const verified = results.filter((r) => r.isVerified && r.isDeliverable).length
    const failed = results.filter((r) => r.error && r.error !== "No match found" && r.error !== "Email undeliverable").length
    const noMatch = results.filter((r) => r.error === "No match found").length
    const undeliverable = results.filter((r) => r.error === "Email undeliverable").length

    // Provider breakdown
    const byProvider: Record<string, number> = {}
    for (const r of results) {
      if (r.source) {
        byProvider[r.source] = (byProvider[r.source] || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: results.length,
        enriched,
        verified,
        failed,
        noMatch,
        undeliverable,
        successRate: ((enriched / results.length) * 100).toFixed(1),
        byProvider,
      },
      configuredProviders: {
        pdl: !!PDL_API_KEY,
        apollo: !!APOLLO_API_KEY,
        hunter: !!HUNTER_API_KEY,
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

export async function GET() {
  // Return available providers and their status
  return NextResponse.json({
    providers: {
      pdl: { configured: !!PDL_API_KEY, name: "People Data Labs", description: "Best for phone-based lookup" },
      apollo: { configured: !!APOLLO_API_KEY, name: "Apollo.io", description: "Best for name + company search" },
      hunter: { configured: !!HUNTER_API_KEY, name: "Hunter.io", description: "Best for domain-based email + verification" },
    },
    canVerify: !!HUNTER_API_KEY,
  })
}
