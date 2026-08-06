import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const DEMO_WORKSPACE_SLUG = "demo"
const DEMO_WORKSPACE_NAME = "Demo Workspace"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * POST /api/compliance-demo/setup
 * Sets up a demo workspace for a user (creates workspace if needed, adds user membership)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Check if demo workspace exists
    let { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", DEMO_WORKSPACE_SLUG)
      .maybeSingle()

    // Create demo workspace if it doesn't exist
    if (!workspace) {
      const { data: newWorkspace, error: createError } = await supabase
        .from("workspaces")
        .insert({
          name: DEMO_WORKSPACE_NAME,
          slug: DEMO_WORKSPACE_SLUG,
        })
        .select("id")
        .single()

      if (createError) {
        console.error("Failed to create demo workspace:", createError)
        return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
      }

      workspace = newWorkspace
    }

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 500 })
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from("workspace_users")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", userId)
      .maybeSingle()

    // Add user to workspace if not already a member
    if (!existingMembership) {
      const { error: memberError } = await supabase
        .from("workspace_users")
        .insert({
          workspace_id: workspace.id,
          user_id: userId,
          role: "member",
        })

      if (memberError) {
        console.error("Failed to add user to workspace:", memberError)
        // Don't fail - user might already be added by trigger
      }
    }

    // Ensure user has a profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (!profile) {
      // Get user info from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      
      if (authUser?.user) {
        await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || "Demo User",
          })
      }
    }

    return NextResponse.json({
      success: true,
      workspace_id: workspace.id,
      workspace_slug: DEMO_WORKSPACE_SLUG,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Setup failed" }, { status: 500 })
  }
}
