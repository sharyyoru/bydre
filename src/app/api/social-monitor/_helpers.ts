import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Verify the current user is an admin of the given workspace.
 * Returns { userId } on success or a NextResponse error to return early.
 */
export async function requireWorkspaceAdmin(workspaceId: string): Promise<
  { userId: string } | { error: NextResponse }
> {
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

  if (!member || (member as { role: string }).role !== "admin") {
    return {
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    }
  }

  return { userId: user.id }
}

export function notConfigured(provider: string) {
  return NextResponse.json(
    {
      error: `${provider} not configured`,
      code: "not_configured",
      provider,
    },
    { status: 501 }
  )
}
