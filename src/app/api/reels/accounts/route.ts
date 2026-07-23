import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember, requireWorkspaceAdmin } from "../_helpers"

/** GET — list connected social accounts for a workspace. */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accounts: data })
}

/**
 * POST — register/connect an account (manual entry until OAuth ships).
 * Body: { workspace_id, platform, kind?, external_account_id?, username?, page_id?, owner_user_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, platform } = body
    if (!workspace_id || !platform) {
      return NextResponse.json({ error: "workspace_id and platform required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("social_accounts")
      .upsert(
        {
          workspace_id,
          platform,
          kind: body.kind || "brand",
          external_account_id: body.external_account_id || null,
          username: body.username || null,
          page_id: body.page_id || null,
          owner_user_id: body.owner_user_id || null,
          status: "connected",
        },
        { onConflict: "workspace_id, platform, external_account_id" }
      )
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ account: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/** DELETE — remove a connected account. Body: { workspace_id, id } */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id } = body
    if (!workspace_id || !id) {
      return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })
    }
    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
