import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateToken } from "@/lib/compliance/instagram-api"

/**
 * GET - List connected Instagram accounts for a workspace
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  const userId = request.nextUrl.searchParams.get("user_id") // Optional: filter by agent
  
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  let query = supabase
    .from("agent_instagram_accounts")
    .select(`
      id,
      workspace_id,
      user_id,
      instagram_user_id,
      username,
      display_name,
      profile_picture_url,
      status,
      last_synced_at,
      created_at
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
  
  if (userId) {
    query = query.eq("user_id", userId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ accounts: data })
}

/**
 * POST - Connect an Instagram account (manual token entry for MVP)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, access_token } = body
    
    if (!workspace_id || !access_token) {
      return NextResponse.json(
        { error: "workspace_id and access_token are required" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Validate token
    const tokenInfo = await validateToken(access_token)
    if (!tokenInfo.valid) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 400 }
      )
    }
    
    // Get Instagram user info
    // First try to get "me" which should return the IG business account
    let igUser
    try {
      // For business accounts linked via Facebook Page
      const meResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${access_token}`
      )
      const meData = await meResponse.json()
      
      const pageWithIG = meData.data?.find((p: { instagram_business_account?: unknown }) => p.instagram_business_account)
      if (pageWithIG?.instagram_business_account) {
        igUser = pageWithIG.instagram_business_account
      } else {
        // Try direct IG user (for creator accounts)
        const igMeResponse = await fetch(
          `https://graph.facebook.com/v21.0/me?fields=id,username,name,profile_picture_url&access_token=${access_token}`
        )
        igUser = await igMeResponse.json()
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch Instagram account info" },
        { status: 400 }
      )
    }
    
    if (!igUser?.id) {
      return NextResponse.json(
        { error: "Could not find Instagram business account linked to this token" },
        { status: 400 }
      )
    }
    
    // Calculate token expiry (long-lived tokens last ~60 days)
    const tokenExpiresAt = tokenInfo.expires_at
      ? new Date(tokenInfo.expires_at * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // Default 60 days
    
    // Use admin client to store the access token (bypasses RLS for insert)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("agent_instagram_accounts")
      .upsert(
        {
          workspace_id,
          user_id: user.id,
          instagram_user_id: igUser.id,
          username: igUser.username || null,
          display_name: igUser.name || null,
          profile_picture_url: igUser.profile_picture_url || null,
          access_token,
          token_expires_at: tokenExpiresAt,
          status: "connected",
          last_error: null,
        },
        { onConflict: "workspace_id, instagram_user_id" }
      )
      .select(`
        id,
        workspace_id,
        user_id,
        instagram_user_id,
        username,
        display_name,
        profile_picture_url,
        status,
        created_at
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ account: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Disconnect an Instagram account
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, workspace_id } = body
    
    if (!id || !workspace_id) {
      return NextResponse.json(
        { error: "id and workspace_id are required" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Users can only delete their own accounts, or admins can delete any
    const { data: account } = await supabase
      .from("agent_instagram_accounts")
      .select("user_id")
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .maybeSingle()
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    
    // Check if user owns this account or is admin
    if (account.user_id !== user.id) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace_id)
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (!member || member.role !== "admin") {
        return NextResponse.json(
          { error: "You can only disconnect your own Instagram account" },
          { status: 403 }
        )
      }
    }
    
    // Delete the account
    const { error } = await supabase
      .from("agent_instagram_accounts")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
