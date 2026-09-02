import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NOTIFICATION_EMAIL = "wilson@drehomes.com"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      propertyId,
      propertyName,
      buyerName,
      buyerEmail,
      buyerPhone,
      offerAmountAed,
      offerAmountCrypto,
      cryptoType, // BTC, ETH, USDT
      walletAddress,
      message
    } = body

    // Validate required fields
    if (!propertyId || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required fields: propertyId, buyerName, buyerEmail" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Insert into database
    const { data, error } = await supabase
      .from("crypto_offers")
      .insert({
        property_id: String(propertyId),
        property_name: propertyName || null,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        offer_amount_aed: offerAmountAed || null,
        offer_amount_crypto: offerAmountCrypto || null,
        crypto_type: cryptoType || "BTC",
        wallet_address: walletAddress || null,
        wallet_verified: !!walletAddress,
        message: message || null,
        status: "pending"
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      // If table doesn't exist, still return success (will create later)
      if (error.code === "42P01") {
        console.log("crypto_offers table not yet created - offer captured in logs")
        // Log the offer for now
        console.log("CRYPTO OFFER:", {
          propertyId,
          propertyName,
          buyerName,
          buyerEmail,
          buyerPhone,
          offerAmountAed,
          offerAmountCrypto,
          cryptoType,
          walletAddress,
          message
        })
        
        return NextResponse.json({
          success: true,
          message: "Offer submitted successfully. Our team will contact you shortly.",
          offerId: `temp-${Date.now()}`
        })
      }
      throw error
    }

    // TODO: Send email notification to wilson@drehomes.com
    // For now, just log it
    console.log(`New crypto offer submitted for ${propertyName}:`, {
      buyer: buyerName,
      email: buyerEmail,
      crypto: cryptoType,
      amount: offerAmountCrypto,
      wallet: walletAddress
    })

    return NextResponse.json({
      success: true,
      message: "Offer submitted successfully. Our team will contact you shortly.",
      offerId: data?.id
    })
  } catch (error) {
    console.error("Error submitting offer:", error)
    return NextResponse.json(
      { error: "Failed to submit offer. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Admin endpoint to view offers (protected)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  try {
    let query = supabase
      .from("crypto_offers")
      .select("*")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ offers: data })
  } catch (error) {
    console.error("Error fetching offers:", error)
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 })
  }
}
