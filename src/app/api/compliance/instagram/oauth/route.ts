import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
const INSTAGRAM_OAUTH_SCOPES = [
  "instagram_basic",
  "instagram_content_publish", 
  "instagram_manage_comments",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",")

/**
 * GET - Initiate Instagram OAuth flow
 * Redirects user to Facebook login dialog
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }

  if (!FACEBOOK_APP_ID) {
    return NextResponse.json({ error: "Facebook App ID not configured" }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Build redirect URI
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUri = `${baseUrl}/api/compliance/instagram/callback`
  
  // State contains workspace_id and user_id for the callback
  const state = Buffer.from(JSON.stringify({
    workspace_id: workspaceId,
    user_id: user.id,
    timestamp: Date.now(),
  })).toString("base64")

  // Build Facebook OAuth URL
  const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth")
  oauthUrl.searchParams.set("client_id", FACEBOOK_APP_ID)
  oauthUrl.searchParams.set("redirect_uri", redirectUri)
  oauthUrl.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPES)
  oauthUrl.searchParams.set("response_type", "code")
  oauthUrl.searchParams.set("state", state)

  return NextResponse.redirect(oauthUrl.toString())
}
