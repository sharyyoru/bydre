import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireWorkspaceMember } from "../_helpers"
import { DEFAULT_MODEL, isChatModel } from "@/lib/dreagent/types"

/** GET — list conversations for a workspace (newest activity first). */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dreagent_conversations")
    .select("id, workspace_id, created_by, title, model, created_at, updated_at, profiles:created_by(full_name, email)")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations = ((data || []) as any[]).map((c) => {
    const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    return { ...c, creator_name: p?.full_name || p?.email || null, profiles: undefined }
  })
  return NextResponse.json({ conversations })
}

/** POST — create a new conversation. Body: { workspace_id, model?, title? } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id } = body
    if (!workspace_id) return NextResponse.json({ error: "workspace_id required" }, { status: 400 })

    const auth = await requireWorkspaceMember(workspace_id)
    if ("error" in auth) return auth.error

    const model = isChatModel(body.model) ? body.model : DEFAULT_MODEL
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("dreagent_conversations")
      .insert({
        workspace_id,
        created_by: auth.userId,
        title: (body.title as string)?.slice(0, 80) || "New chat",
        model,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ conversation: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 })
  }
}

/** PATCH — rename or change model. Body: { workspace_id, id, title?, model? } */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id } = body
    if (!workspace_id || !id) return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })

    const auth = await requireWorkspaceMember(workspace_id)
    if ("error" in auth) return auth.error

    const update: Record<string, unknown> = {}
    if (typeof body.title === "string") update.title = body.title.slice(0, 80)
    if (isChatModel(body.model)) update.model = body.model
    if (!Object.keys(update).length) return NextResponse.json({ error: "nothing to update" }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("dreagent_conversations")
      .update(update)
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ conversation: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 })
  }
}

/** DELETE — remove a conversation (messages cascade). Body: { workspace_id, id } */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, id } = body
    if (!workspace_id || !id) return NextResponse.json({ error: "workspace_id and id required" }, { status: 400 })

    const auth = await requireWorkspaceMember(workspace_id)
    if ("error" in auth) return auth.error

    const supabase = await createClient()
    const { error } = await supabase
      .from("dreagent_conversations")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 })
  }
}
