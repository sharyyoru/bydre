import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey || serviceRoleKey === "your_service_role_key") {
    throw new Error("Server configuration is missing SUPABASE_SERVICE_ROLE_KEY")
  }
  return createAdminClient(url, serviceRoleKey)
}

async function authorize(workspaceId: string) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membership?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access is required" }, { status: 403 }) }
  }

  try {
    return { user, admin: adminClient() }
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: error instanceof Error ? error.message : "Server configuration error" },
        { status: 500 }
      ),
    }
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const authorization = await authorize(workspaceId)
  if (authorization.error) return authorization.error

  const body = await request.json()
  const email = String(body.email || "").trim().toLowerCase()
  const fullName = String(body.fullName || "").trim()
  const password = String(body.password || "")
  const role = body.role === "admin" ? "admin" : "member"

  if (!email || !fullName || password.length < 12) {
    return NextResponse.json({ error: "Name, email, and a 12-character temporary password are required" }, { status: 400 })
  }

  const { data: existingProfile } = await authorization.admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  let targetUserId = existingProfile?.id
  if (!targetUserId) {
    const { data, error } = await authorization.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, must_change_password: true },
    })
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Unable to create user" }, { status: 400 })
    }
    targetUserId = data.user.id
  } else {
    const { error } = await authorization.admin.auth.admin.updateUserById(targetUserId, {
      user_metadata: { full_name: fullName, must_change_password: true },
      password,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { error: membershipError } = await authorization.admin
    .from("workspace_members")
    .upsert({ workspace_id: workspaceId, user_id: targetUserId, role })

  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 400 })

  await authorization.admin.from("activity_events").insert({
    workspace_id: workspaceId,
    actor_id: authorization.user.id,
    actor_type: "user",
    event_type: "user.created",
    entity_type: "workspace_member",
    entity_id: targetUserId,
    after_data: { email, full_name: fullName, role },
  })

  return NextResponse.json({ id: targetUserId })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const authorization = await authorize(workspaceId)
  if (authorization.error) return authorization.error

  const body = await request.json()
  const userId = String(body.userId || "")
  const role = body.role === "admin" ? "admin" : "member"
  if (!userId) return NextResponse.json({ error: "User is required" }, { status: 400 })

  const { count: adminCount } = await authorization.admin
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("role", "admin")

  if (userId === authorization.user.id && role !== "admin" && (adminCount || 0) <= 1) {
    return NextResponse.json({ error: "The final Admin cannot be demoted" }, { status: 400 })
  }

  const { data: before } = await authorization.admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()

  const { error } = await authorization.admin
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await authorization.admin.from("activity_events").insert({
    workspace_id: workspaceId,
    actor_id: authorization.user.id,
    actor_type: "user",
    event_type: "user.role_changed",
    entity_type: "workspace_member",
    entity_id: userId,
    before_data: before,
    after_data: { role },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const authorization = await authorize(workspaceId)
  if (authorization.error) return authorization.error

  const userId = new URL(request.url).searchParams.get("userId")
  if (!userId || userId === authorization.user.id) {
    return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 })
  }

  const { data: target } = await authorization.admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()

  if (target?.role === "admin") {
    const { count } = await authorization.admin
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("role", "admin")
    if ((count || 0) <= 1) return NextResponse.json({ error: "The final Admin cannot be removed" }, { status: 400 })
  }

  const { error } = await authorization.admin
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await authorization.admin.from("activity_events").insert({
    workspace_id: workspaceId,
    actor_id: authorization.user.id,
    actor_type: "user",
    event_type: "user.removed",
    entity_type: "workspace_member",
    entity_id: userId,
    before_data: target,
  })

  return NextResponse.json({ ok: true })
}
