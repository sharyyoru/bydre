import type { SupabaseClient } from "@supabase/supabase-js"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Resolve a workspace URL identifier (which may be a slug like "drehomes" or a
 * UUID) to the canonical workspace UUID. Returns null if not found.
 *
 * Workspace routes use the slug in the URL, but API routes and RLS filter on
 * the UUID `workspace_id` column — passing a slug there fails the lookup.
 */
export async function resolveWorkspaceId(
  supabase: SupabaseClient,
  identifier: string
): Promise<string | null> {
  if (!identifier) return null
  const column = UUID_RE.test(identifier) ? "id" : "slug"
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq(column, identifier)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}
