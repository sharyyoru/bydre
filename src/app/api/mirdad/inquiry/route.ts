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
    const { name, email, phone, inquiryType, message, preferredLanguage, modelId } = body

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and email are required" },
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

    // Check if customer exists, create if not
    let customerId: string

    const { data: existingCustomer } = await supabase
      .from("mirdad_customers")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update customer info if provided
      await supabase
        .from("mirdad_customers")
        .update({
          name: name || undefined,
          phone: phone || undefined,
          preferred_language: preferredLanguage || undefined,
        })
        .eq("id", customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from("mirdad_customers")
        .insert({
          email: email.toLowerCase().trim(),
          name: name,
          phone: phone || null,
          preferred_language: preferredLanguage || "en",
        })
        .select("id")
        .single()

      if (customerError || !newCustomer) {
        console.error("Customer creation error:", customerError)
        return NextResponse.json(
          { error: "Failed to create customer record" },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // Create inquiry
    const { error: inquiryError } = await supabase
      .from("mirdad_inquiries")
      .insert({
        customer_id: customerId,
        model_id: modelId || null,
        message: message || null,
        inquiry_type: inquiryType || "question",
        status: "new",
      })

    if (inquiryError) {
      console.error("Inquiry creation error:", inquiryError)
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry submitted successfully",
    })
  } catch (error) {
    console.error("Inquiry submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
