import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET

/**
 * GET - Handle Instagram OAuth callback
 * Exchanges code for access token and saves account
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const stateParam = request.nextUrl.searchParams.get("state")
  const error = request.nextUrl.searchParams.get("error")
  const errorDescription = request.nextUrl.searchParams.get("error_description")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  // Handle OAuth errors
  if (error) {
    console.error("Instagram OAuth error:", error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/workspace/drehomes/compliance?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${baseUrl}/workspace/drehomes/compliance?error=Missing+authorization+code`
    )
  }

  // Decode state
  let state: { workspace_id: string; user_id: string; timestamp: number }
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64").toString())
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/workspace/drehomes/compliance?error=Invalid+state+parameter`
    )
  }

  // Validate state timestamp (max 10 minutes)
  if (Date.now() - state.timestamp > 10 * 60 * 1000) {
    return NextResponse.redirect(
      `${baseUrl}/workspace/${state.workspace_id}/compliance?error=OAuth+session+expired`
    )
  }

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return NextResponse.redirect(
      `${baseUrl}/workspace/${state.workspace_id}/compliance?error=Facebook+app+not+configured`
    )
  }

  const redirectUri = `${baseUrl}/api/compliance/instagram/callback`

  try {
    // Exchange code for short-lived token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `code=${code}`
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error)
      return NextResponse.redirect(
        `${baseUrl}/workspace/${state.workspace_id}/compliance?error=${encodeURIComponent(tokenData.error.message || "Token exchange failed")}`
      )
    }

    const shortLivedToken = tokenData.access_token

    // Exchange for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${shortLivedToken}`
    )

    const longLivedData = await longLivedResponse.json()

    if (longLivedData.error) {
      console.error("Long-lived token error:", longLivedData.error)
      return NextResponse.redirect(
        `${baseUrl}/workspace/${state.workspace_id}/compliance?error=${encodeURIComponent(longLivedData.error.message || "Failed to get long-lived token")}`
      )
    }

    const accessToken = longLivedData.access_token
    const expiresIn = longLivedData.expires_in || 5184000 // Default 60 days

    // Get Facebook pages with Instagram accounts
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`
    )
    const pagesData = await pagesResponse.json()

    // Find Instagram business account
    let igAccount: { id: string; username?: string; name?: string; profile_picture_url?: string } | null = null
    let pageAccessToken = accessToken

    if (pagesData.data) {
      for (const page of pagesData.data) {
        if (page.instagram_business_account) {
          igAccount = page.instagram_business_account
          
          // Get page-specific long-lived token for better permissions
          const pageTokenResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?fields=access_token&access_token=${accessToken}`
          )
          const pageTokenData = await pageTokenResponse.json()
          if (pageTokenData.access_token) {
            pageAccessToken = pageTokenData.access_token
          }
          break
        }
      }
    }

    // If no business account, try creator account
    if (!igAccount) {
      const meResponse = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`
      )
      const meData = await meResponse.json()
      
      if (meData.id) {
        // Try to get Instagram user directly
        const igResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
        )
        const igData = await igResponse.json()
        if (igData.id) {
          igAccount = igData
        }
      }
    }

    if (!igAccount?.id) {
      return NextResponse.redirect(
        `${baseUrl}/workspace/${state.workspace_id}/compliance?error=No+Instagram+business+account+found`
      )
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Save to database using admin client
    const supabase = createAdminClient()

    // Check if account already exists
    const { data: existing } = await supabase
      .from("agent_instagram_accounts")
      .select("id")
      .eq("workspace_id", state.workspace_id)
      .eq("instagram_user_id", igAccount.id)
      .single()

    if (existing) {
      // Update existing account
      await supabase
        .from("agent_instagram_accounts")
        .update({
          access_token: pageAccessToken,
          token_expires_at: tokenExpiresAt,
          username: igAccount.username,
          display_name: igAccount.name,
          profile_picture_url: igAccount.profile_picture_url,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
    } else {
      // Create new account
      await supabase
        .from("agent_instagram_accounts")
        .insert({
          workspace_id: state.workspace_id,
          user_id: state.user_id,
          instagram_user_id: igAccount.id,
          username: igAccount.username,
          display_name: igAccount.name,
          profile_picture_url: igAccount.profile_picture_url,
          access_token: pageAccessToken,
          token_expires_at: tokenExpiresAt,
          is_active: true,
        })
    }

    // Success - redirect back to compliance page
    return NextResponse.redirect(
      `${baseUrl}/workspace/${state.workspace_id}/compliance?success=Instagram+connected+successfully`
    )

  } catch (err) {
    console.error("OAuth callback error:", err)
    return NextResponse.redirect(
      `${baseUrl}/workspace/${state.workspace_id}/compliance?error=Connection+failed`
    )
  }
}
