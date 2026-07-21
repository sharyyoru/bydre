import { NextRequest, NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireWorkspaceAdmin } from "../_helpers"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/** GET — list feed tokens (masked; never returns the secret). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }
  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("social_feed_tokens")
    .select("id, name, revoked_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tokens: data })
}

/** POST — create a token. Returns the plaintext secret ONCE. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, name } = body
    if (!workspace_id || !name) {
      return NextResponse.json({ error: "workspace_id and name required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const token = `smf_${randomBytes(24).toString("hex")}`
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("social_feed_tokens")
      .insert({
        workspace_id,
        name,
        token_hash: hashToken(token),
        created_by: auth.userId,
      })
      .select("id, name, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Return the secret once — it cannot be retrieved again.
    return NextResponse.json({ token: data, secret: token }, { status: 201 })
  } catch (err) {
    console.error("feed-tokens POST error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/** DELETE — revoke a token. */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id } = body
    if (!workspace_id || !id) {
      return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const admin = createAdminClient()
    const { error } = await admin
      .from("social_feed_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspace_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("feed-tokens DELETE error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
