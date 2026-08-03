import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCredential } from "@/lib/social-monitor/credentials"
import { buildContentPrompt } from "@/lib/creative-studio/prompts"
import { TemplateType, ContentStyle, GenieMapProject, GeneratedContent } from "@/lib/creative-studio/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      workspace_id, 
      project_id, 
      template_type, 
      branding_type, 
      style = "luxury" 
    } = body

    if (!workspace_id || !project_id || !template_type) {
      return NextResponse.json(
        { error: "workspace_id, project_id, and template_type are required" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Fetch project data
    const { data: project, error: projectError } = await admin
      .from("geniemap_projects")
      .select("*")
      .eq("id", project_id)
      .eq("workspace_id", workspace_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get Gemini credential
    const geminiCred = await getCredential(workspace_id, "gemini")
    if (!geminiCred) {
      return NextResponse.json(
        { error: "Gemini API not configured. Add your API key in Settings." },
        { status: 501 }
      )
    }

    // Get branding if personal
    let agentName: string | undefined
    const companyName = "DreHomes"

    if (branding_type === "personal") {
      // Could fetch agent branding here if needed
    }

    // Build prompt
    const prompt = buildContentPrompt({
      project: project as unknown as GenieMapProject,
      templateType: template_type as TemplateType,
      style: style as ContentStyle,
      agentName,
      companyName,
    })

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiCred.secret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text()
      console.error("Gemini error:", err)
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      )
    }

    // Parse JSON from response
    let content: GeneratedContent
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found")
      content = JSON.parse(jsonMatch[0])
    } catch {
      // Fallback: create structured content from text
      content = {
        headline: project.name,
        body_copy: textContent.slice(0, 500),
        hashtags: ["DubaiRealEstate", "OffPlan", "Investment"],
        cta: "Contact us today!",
        selected_image: project.images?.[0] || project.image_url || null,
      }
    }

    // Add selected image
    content.selected_image = project.images?.[0] || project.image_url || null

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Creative generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
