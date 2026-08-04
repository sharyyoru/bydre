import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ComplianceStatus } from "@/lib/compliance/types"

/**
 * GET - Get compliance reports and statistics
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  const agentId = request.nextUrl.searchParams.get("agent_id")
  const status = request.nextUrl.searchParams.get("status") as ComplianceStatus | null
  const fromDate = request.nextUrl.searchParams.get("from")
  const toDate = request.nextUrl.searchParams.get("to")
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50")
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0")
  
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Build query for posts with compliance checks
  let postsQuery = supabase
    .from("instagram_posts")
    .select(`
      id,
      instagram_media_id,
      media_type,
      media_url,
      thumbnail_url,
      permalink,
      caption,
      posted_at,
      agent_account:agent_instagram_accounts(
        id,
        user_id,
        username,
        display_name,
        profile_picture_url
      ),
      compliance_check:post_compliance_checks(
        id,
        is_real_estate_content,
        detected_project_id,
        detected_project_name,
        company_qr_found,
        project_qr_found,
        project_qr_correct,
        compliance_status,
        checked_at,
        reviewed_by,
        reviewed_at
      )
    `, { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("posted_at", { ascending: false })
    .range(offset, offset + limit - 1)
  
  // Filter by agent if specified
  if (agentId) {
    postsQuery = postsQuery.eq("agent_account.user_id", agentId)
  }
  
  // Filter by date range
  if (fromDate) {
    postsQuery = postsQuery.gte("posted_at", fromDate)
  }
  if (toDate) {
    postsQuery = postsQuery.lte("posted_at", toDate)
  }
  
  const { data: posts, count, error } = await postsQuery
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Filter by status if needed (post-query since it's in a joined table)
  let filteredPosts = posts
  if (status) {
    filteredPosts = posts?.filter(p => {
      const check = Array.isArray(p.compliance_check) 
        ? p.compliance_check[0] 
        : p.compliance_check
      return check?.compliance_status === status
    }) || []
  }
  
  // Calculate statistics
  const allChecks = posts?.flatMap(p => {
    const check = Array.isArray(p.compliance_check) 
      ? p.compliance_check[0] 
      : p.compliance_check
    return check ? [check] : []
  }) || []
  
  const stats = {
    total_posts: count || 0,
    analyzed: allChecks.length,
    compliant: allChecks.filter(c => c.compliance_status === "compliant").length,
    violations: allChecks.filter(c => 
      ["missing_company_qr", "missing_project_qr", "wrong_project_qr"].includes(c.compliance_status)
    ).length,
    pending: allChecks.filter(c => c.compliance_status === "pending").length,
    not_applicable: allChecks.filter(c => c.compliance_status === "not_applicable").length,
    compliance_rate: 0,
  }
  
  // Calculate compliance rate (excluding not_applicable and pending)
  const applicableCount = stats.compliant + stats.violations
  stats.compliance_rate = applicableCount > 0 
    ? Math.round((stats.compliant / applicableCount) * 100) 
    : 100
  
  // Group by violation type
  const byViolationType = {
    missing_company_qr: allChecks.filter(c => c.compliance_status === "missing_company_qr").length,
    missing_project_qr: allChecks.filter(c => c.compliance_status === "missing_project_qr").length,
    wrong_project_qr: allChecks.filter(c => c.compliance_status === "wrong_project_qr").length,
  }
  
  return NextResponse.json({
    posts: filteredPosts,
    stats,
    by_violation_type: byViolationType,
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: (offset + limit) < (count || 0),
    },
  })
}

/**
 * POST - Mark a compliance check as reviewed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, check_id, review_notes } = body
    
    if (!workspace_id || !check_id) {
      return NextResponse.json(
        { error: "workspace_id and check_id are required" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Verify admin access
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()
    
    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    // Update the compliance check
    const { data, error } = await supabase
      .from("post_compliance_checks")
      .update({
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
      })
      .eq("id", check_id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ check: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
