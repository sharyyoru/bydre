import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchUserMedia, fetchCarouselChildren } from "@/lib/compliance/instagram-api"
import { analyzePost, getPostImageUrls } from "@/lib/compliance/analyzer"
import { evaluateCompliance } from "@/lib/compliance/compliance-engine"
import { getCredential } from "@/lib/social-monitor/credentials"
import { InstagramPost, ComplianceQRCode } from "@/lib/compliance/types"

/**
 * POST - Sync an Instagram account's posts and run compliance checks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, account_id, limit = 20 } = body
    
    if (!workspace_id || !account_id) {
      return NextResponse.json(
        { error: "workspace_id and account_id are required" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get the Instagram account
    const admin = createAdminClient()
    const { data: account, error: accountError } = await admin
      .from("agent_instagram_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("workspace_id", workspace_id)
      .single()
    
    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    
    // Check if user has permission (owner or admin)
    if (account.user_id !== user.id) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace_id)
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (!member || member.role !== "admin") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }
    
    // Get Gemini API key for analysis
    const geminiCred = await getCredential(workspace_id, "gemini")
    if (!geminiCred) {
      return NextResponse.json(
        { error: "Gemini API not configured. Add your API key in Settings." },
        { status: 501 }
      )
    }
    
    // Fetch recent media from Instagram
    let media
    try {
      media = await fetchUserMedia(
        account.instagram_user_id,
        account.access_token,
        { limit }
      )
    } catch (e) {
      // Update account status on error
      await admin
        .from("agent_instagram_accounts")
        .update({
          status: "error",
          last_error: e instanceof Error ? e.message : "Failed to fetch media",
        })
        .eq("id", account_id)
      
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to fetch Instagram posts" },
        { status: 502 }
      )
    }
    
    // Get registered QR codes
    const { data: qrCodes } = await supabase
      .from("compliance_qr_codes")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("is_active", true)
    
    // Get GenieMap projects for matching
    const { data: projects } = await supabase
      .from("geniemap_projects")
      .select("id, name, developer_name, district_name")
      .eq("workspace_id", workspace_id)
    
    const results = {
      posts_synced: 0,
      posts_analyzed: 0,
      compliant: 0,
      violations: 0,
      skipped: 0,
      errors: [] as string[],
    }
    
    // Process each post
    for (const igPost of media.media) {
      try {
        // Get carousel children if needed
        let children: { media_url?: string }[] | undefined
        if (igPost.media_type === "CAROUSEL_ALBUM" && igPost.children?.data) {
          try {
            children = await fetchCarouselChildren(
              igPost.id,
              account.access_token
            )
          } catch {
            children = igPost.children.data
          }
        }
        
        // Upsert post
        const { data: post, error: postError } = await admin
          .from("instagram_posts")
          .upsert(
            {
              workspace_id,
              agent_account_id: account_id,
              instagram_media_id: igPost.id,
              media_type: igPost.media_type,
              media_url: igPost.media_url || null,
              thumbnail_url: igPost.thumbnail_url || null,
              permalink: igPost.permalink || null,
              caption: igPost.caption || null,
              posted_at: igPost.timestamp || null,
            },
            { onConflict: "workspace_id, instagram_media_id" }
          )
          .select()
          .single()
        
        if (postError) {
          results.errors.push(`Failed to save post ${igPost.id}: ${postError.message}`)
          continue
        }
        
        results.posts_synced++
        
        // Check if already analyzed
        const { data: existingCheck } = await supabase
          .from("post_compliance_checks")
          .select("id")
          .eq("post_id", post.id)
          .maybeSingle()
        
        if (existingCheck) {
          results.skipped++
          continue
        }
        
        // Get image URLs for analysis
        const postWithChildren = {
          ...post,
          children: children?.map(c => ({ media_url: c.media_url })),
        }
        const imageUrls = getPostImageUrls(postWithChildren as InstagramPost & { children?: { media_url?: string }[] })
        
        // Skip if no images
        if (imageUrls.length === 0) {
          // Create a "not applicable" check
          await admin
            .from("post_compliance_checks")
            .insert({
              post_id: post.id,
              is_real_estate_content: false,
              compliance_status: "not_applicable",
              ai_analysis_raw: { reason: "No images to analyze" },
            })
          results.skipped++
          continue
        }
        
        // Run AI analysis
        const analysis = await analyzePost(
          post as InstagramPost,
          imageUrls,
          projects || [],
          (qrCodes || []) as ComplianceQRCode[],
          geminiCred.secret
        )
        
        // Evaluate compliance
        const compliance = evaluateCompliance(
          analysis,
          (qrCodes || []) as ComplianceQRCode[]
        )
        
        // Save compliance check
        await admin
          .from("post_compliance_checks")
          .insert({
            post_id: post.id,
            is_real_estate_content: analysis.classification.is_real_estate,
            real_estate_confidence: analysis.classification.confidence,
            detected_project_id: analysis.project?.project_id || null,
            detected_project_name: analysis.project?.project_name || null,
            detected_project_confidence: analysis.project?.confidence || null,
            company_qr_found: compliance.company_qr_found,
            project_qr_found: compliance.project_qr_found,
            project_qr_correct: compliance.project_qr_correct,
            detected_qr_codes: analysis.qr_detection.qr_codes,
            compliance_status: compliance.status,
            ai_analysis_raw: {
              classification: analysis.classification,
              project: analysis.project,
              qr_detection: analysis.qr_detection,
              processing_time_ms: analysis.processing_time_ms,
            },
            transcript: analysis.transcription?.transcript || null,
          })
        
        results.posts_analyzed++
        
        if (compliance.status === "compliant" || compliance.status === "not_applicable") {
          results.compliant++
        } else {
          results.violations++
          
          // TODO: Send notifications for violations
        }
      } catch (e) {
        results.errors.push(
          `Error processing post ${igPost.id}: ${e instanceof Error ? e.message : "Unknown error"}`
        )
      }
    }
    
    // Update account last synced
    await admin
      .from("agent_instagram_accounts")
      .update({
        last_synced_at: new Date().toISOString(),
        status: "connected",
        last_error: null,
      })
      .eq("id", account_id)
    
    return NextResponse.json({
      success: true,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
