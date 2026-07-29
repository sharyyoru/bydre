import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember } from "../../_helpers"
import { buildDownloadUrl, getApiKey } from "@/lib/veo/client"
import { VeoNotConfiguredError, VideoResultFile } from "@/lib/veo/types"

export const maxDuration = 60

/**
 * GET — stream a generated video from Google using the server-side API key
 * (the key is never exposed to the client). Query: workspace_id, id, idx?
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  const id = request.nextUrl.searchParams.get("id")
  const idx = Number(request.nextUrl.searchParams.get("idx") || 0)
  const download = request.nextUrl.searchParams.get("download") === "1"
  if (!workspaceId || !id) {
    return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })
  }

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data: gen } = await supabase
    .from("media_generations")
    .select("result, expires_at, status")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (!gen) return NextResponse.json({ error: "generation not found" }, { status: 404 })

  const row = gen as { result: VideoResultFile[]; expires_at: string | null; status: string }
  if (row.status !== "succeeded") {
    return NextResponse.json({ error: "generation not ready" }, { status: 409 })
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "media expired" }, { status: 410 })
  }
  const file = row.result?.[idx]
  if (!file?.uri) return NextResponse.json({ error: "file not found" }, { status: 404 })

  let apiKey: string
  try {
    apiKey = await getApiKey(workspaceId)
  } catch (e) {
    if (e instanceof VeoNotConfiguredError) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 501 })
    }
    throw e
  }

  const upstream = await fetch(buildDownloadUrl(file.uri, apiKey))
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream fetch failed (${upstream.status})` }, { status: 502 })
  }

  const headers = new Headers()
  headers.set("Content-Type", file.mimeType || "video/mp4")
  const len = upstream.headers.get("content-length")
  if (len) headers.set("Content-Length", len)
  if (download) headers.set("Content-Disposition", `attachment; filename="veo-${id}.mp4"`)
  headers.set("Cache-Control", "private, max-age=3600")

  return new NextResponse(upstream.body, { status: 200, headers })
}
