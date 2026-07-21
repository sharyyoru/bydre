import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Server-only. Bypasses RLS.
 * Used exclusively by Social Monitor ingestion, credential storage, and the feed route.
 * NEVER import this into client components.
 */
let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  if (cached) return cached

  cached = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return cached
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}
