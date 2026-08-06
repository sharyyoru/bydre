import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

function generateConfirmationCode(): string {
  return `DEL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
}

/**
 * Facebook Data Deletion Callback
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 * 
 * Facebook sends a POST request with a signed_request parameter when a user
 * requests deletion of their data through Facebook.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const signedRequest = formData.get("signed_request") as string

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      )
    }

    // Parse the signed request
    const [encodedSig, payload] = signedRequest.split(".")
    
    if (!encodedSig || !payload) {
      return NextResponse.json(
        { error: "Invalid signed_request format" },
        { status: 400 }
      )
    }

    // Decode the payload
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    )

    const userId = data.user_id
    
    if (!userId) {
      return NextResponse.json(
        { error: "No user_id in request" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const confirmationCode = generateConfirmationCode()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.drehomes.com"

    // Store the deletion request
    await supabase
      .from("data_deletion_requests")
      .insert({
        email: `fb_user_${userId}@facebook.deletion`,
        instagram_handle: null,
        reason: "Facebook data deletion callback",
        confirmation_code: confirmationCode,
        status: "processing",
        requested_at: new Date().toISOString(),
      })

    // Delete Instagram accounts linked to this Facebook user ID
    const { data: accounts } = await supabase
      .from("instagram_accounts")
      .select("id, user_id")
      .eq("facebook_user_id", userId)

    if (accounts && accounts.length > 0) {
      // Delete the accounts
      await supabase
        .from("instagram_accounts")
        .delete()
        .eq("facebook_user_id", userId)

      // Delete related compliance posts
      const userIds = Array.from(new Set(accounts.map(a => a.user_id)))
      for (const uid of userIds) {
        await supabase
          .from("compliance_posts")
          .delete()
          .eq("user_id", uid)
      }
    }

    // Mark as completed
    await supabase
      .from("data_deletion_requests")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString(),
        data_found: accounts && accounts.length > 0
      })
      .eq("confirmation_code", confirmationCode)

    // Return the response format Facebook expects
    return NextResponse.json({
      url: `${baseUrl}/data-deletion/status?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    })
  } catch (error) {
    console.error("Facebook deletion callback error:", error)
    return NextResponse.json(
      { error: "Failed to process deletion request" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Facebook Data Deletion Callback",
    documentation: "https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback",
  })
}
