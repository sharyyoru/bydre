import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"
import { startVideo } from "@/lib/veo/client"
import { VeoApiError, VeoNotConfiguredError } from "@/lib/veo/types"

export const maxDuration = 60

/** GET — list video generation history for a workspace. */
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
    .eq("kind", "video")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generations: data })
}

/**
 * POST — start a Veo video generation (admin only). Returns immediately with a
 * `running` generation row; the client polls /api/veo/videos/[id]/status.
 * Body: { workspace_id, prompt, model?, aspect_ratio?, resolution?,
 *         negative_prompt?, image?: { bytes, mimeType } }
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

    let operationName, model
    try {
      const res = await startVideo({
        workspaceId: workspace_id,
        prompt,
        model: body.model,
        aspectRatio: body.aspect_ratio,
        resolution: body.resolution,
        negativePrompt: body.negative_prompt,
        image: body.image?.bytes ? { bytes: body.image.bytes, mimeType: body.image.mimeType } : undefined,
      })
      operationName = res.operationName
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
        { error: e instanceof Error ? e.message : "Video generation failed", code: status === 403 ? "billing" : undefined },
        { status }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("media_generations")
      .insert({
        workspace_id,
        created_by: auth.userId,
        kind: "video",
        model,
        prompt,
        negative_prompt: body.negative_prompt || null,
        config: {
          aspect_ratio: body.aspect_ratio || "16:9",
          resolution: body.resolution || null,
          image_to_video: !!body.image?.bytes,
        },
        status: "running",
        operation_name: operationName,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ generation: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
