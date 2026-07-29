import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type AuthOk = { userId: string; role: string }
type AuthErr = { error: NextResponse }

/** Require the current user to be a member of the workspace. */
export async function requireWorkspaceMember(workspaceId: string): Promise<AuthOk | AuthErr> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) {
    return { error: NextResponse.json({ error: "Not a workspace member" }, { status: 403 }) }
  }
  return { userId: user.id, role: (member as { role: string }).role }
}

/** Require the current user to be an admin of the workspace. */
export async function requireWorkspaceAdmin(workspaceId: string): Promise<AuthOk | AuthErr> {
  const auth = await requireWorkspaceMember(workspaceId)
  if ("error" in auth) return auth
  if (auth.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }
  return auth
}
