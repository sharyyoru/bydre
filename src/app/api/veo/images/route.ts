import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"
import { generateImages } from "@/lib/veo/client"
import { VeoApiError, VeoNotConfiguredError } from "@/lib/veo/types"

export const maxDuration = 60

/** GET — list image generation history for a workspace. */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("media_generations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("kind", "image")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generations: data })
}

/**
 * POST — generate images with Imagen (admin only).
 * Body: { workspace_id, prompt, model?, number_of_images?, aspect_ratio? }
 * Returns base64 images in-session; only metadata is persisted (ephemeral).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, prompt } = body
    if (!workspace_id || !prompt) {
      return NextResponse.json({ error: "workspace_id and prompt required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    let images, model
    try {
      const res = await generateImages({
        workspaceId: workspace_id,
        prompt,
        model: body.model,
        numberOfImages: Math.min(Math.max(Number(body.number_of_images) || 1, 1), 4),
        aspectRatio: body.aspect_ratio,
      })
      images = res.images
      model = res.model
    } catch (e) {
      if (e instanceof VeoNotConfiguredError) {
        return NextResponse.json(
          { error: "Google API key not configured", code: "not_configured", provider: "gemini" },
          { status: 501 }
        )
      }
      const status = e instanceof VeoApiError ? e.status : 502
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Image generation failed", code: status === 403 ? "billing" : undefined },
        { status }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_generations")
      .insert({
        workspace_id,
        created_by: auth.userId,
        kind: "image",
        model,
        prompt,
        config: {
          aspect_ratio: body.aspect_ratio || "1:1",
          number_of_images: images.length,
        },
        status: "succeeded",
        result: images.map((i) => ({ count: 1, mimeType: i.mimeType })),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ generation: data, images }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
