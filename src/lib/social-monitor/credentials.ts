import { createAdminClient } from "@/lib/supabase/admin"
import { IntegrationProvider } from "./types"

export interface ResolvedCredential {
  secret: string
  config: Record<string, unknown>
}

const ENV_FALLBACK: Record<IntegrationProvider, string | undefined> = {
  gemini: process.env.GEMINI_API_KEY,
  dubai_pulse: process.env.DUBAI_PULSE_API_KEY,
  serpapi: process.env.SERPAPI_API_KEY,
  youtube: process.env.YOUTUBE_API_KEY,
}

/**
 * Load an integration credential for a workspace.
 * DB (integration_credentials) takes precedence; env var is a dev-only fallback.
 * Returns null when no credential is configured anywhere.
 */
export async function getCredential(
  workspaceId: string,
  provider: IntegrationProvider
): Promise<ResolvedCredential | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("integration_credentials")
      .select("secret, config, is_active")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .maybeSingle()

    if (data && (data as { is_active: boolean }).is_active && (data as { secret: string }).secret) {
      return {
        secret: (data as { secret: string }).secret,
        config: ((data as { config: Record<string, unknown> }).config) || {},
      }
    }
  } catch {
    // Service role not configured or query failed — fall through to env fallback.
  }

  const envSecret = ENV_FALLBACK[provider]
  if (envSecret) {
    return { secret: envSecret, config: {} }
  }
  return null
}

export function maskSecret(secret: string): string {
  if (!secret) return ""
  return secret.slice(-4)
}
