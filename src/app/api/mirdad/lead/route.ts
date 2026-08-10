import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      country,
      unitType, 
      message, 
      preferredLanguage, 
      brochureRequested,
      source 
    } = body

    // Validate required fields
    if (!email || !name || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Create lead
    const { error: leadError } = await supabase
      .from("mirdad_leads")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        country: country || null,
        preferred_language: preferredLanguage || "en",
        interested_unit_type: unitType || null,
        message: message || null,
        source: source || "website",
        brochure_requested: brochureRequested || false,
        status: "new",
      })

    if (leadError) {
      console.error("Lead creation error:", leadError)
      return NextResponse.json(
        { error: "Failed to submit registration" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully",
    })
  } catch (error) {
    console.error("Lead submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
