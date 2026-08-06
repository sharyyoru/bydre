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
 * POST /api/data-deletion
 * Public endpoint for data deletion requests (Facebook App requirement)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, instagram_handle, reason } = body

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const confirmationCode = generateConfirmationCode()

    // Store the deletion request
    const { error: insertError } = await supabase
      .from("data_deletion_requests")
      .insert({
        email: email.toLowerCase().trim(),
        instagram_handle: instagram_handle?.trim() || null,
        reason: reason?.trim() || null,
        confirmation_code: confirmationCode,
        status: "pending",
        requested_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("Failed to store deletion request:", insertError)
      // Don't expose internal errors, but still accept the request
    }

    // Try to find and delete actual user data
    // 1. Find Instagram accounts linked to this email
    const { data: users } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())

    if (users && users.length > 0) {
      const userIds = users.map(u => u.id)
      
      // Delete Instagram connections for these users
      await supabase
        .from("instagram_accounts")
        .delete()
        .in("user_id", userIds)

      // Delete compliance posts
      await supabase
        .from("compliance_posts")
        .delete()
        .in("user_id", userIds)

      // Update the deletion request to show data was found and deleted
      await supabase
        .from("data_deletion_requests")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString(),
          data_found: true
        })
        .eq("confirmation_code", confirmationCode)
    } else {
      // No data found, mark as completed anyway
      await supabase
        .from("data_deletion_requests")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString(),
          data_found: false
        })
        .eq("confirmation_code", confirmationCode)
    }

    return NextResponse.json({
      success: true,
      confirmation_code: confirmationCode,
      message: "Your data deletion request has been received and will be processed within 30 days.",
    })
  } catch (error) {
    console.error("Data deletion error:", error)
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}

/**
 * GET /api/data-deletion?code=DEL-XXXXXXXX
 * Check status of a deletion request
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  
  if (!code) {
    return NextResponse.json(
      { error: "Confirmation code required" },
      { status: 400 }
    )
  }

  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from("data_deletion_requests")
      .select("status, requested_at, completed_at")
      .eq("confirmation_code", code)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: data.status,
      requested_at: data.requested_at,
      completed_at: data.completed_at,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    )
  }
}
