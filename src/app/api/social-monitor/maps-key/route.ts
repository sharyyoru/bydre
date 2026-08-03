import { NextRequest, NextResponse } from "next/server"
import { getCredential } from "@/lib/social-monitor/credentials"
import { requireWorkspaceMember } from "../_helpers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspace_id")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const auth = await requireWorkspaceMember(workspaceId)
    if ("error" in auth) return auth.error

    const cred = await getCredential(workspaceId, "google_maps")
    if (!cred) {
      return NextResponse.json({ error: "Google Maps not configured" }, { status: 404 })
    }

    return NextResponse.json({ apiKey: cred.secret })
  } catch (err) {
    console.error("maps-key error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
