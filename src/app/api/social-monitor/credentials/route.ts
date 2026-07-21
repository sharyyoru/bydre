import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { maskSecret } from "@/lib/social-monitor/credentials"
import { requireWorkspaceAdmin } from "../_helpers"

const PROVIDERS = ["gemini", "dubai_pulse", "serpapi", "youtube"] as const

/** GET — masked list of configured credentials for a workspace. */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }

  const auth = await requireWorkspaceAdmin(workspaceId)
  if ("error" in auth) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("integration_credentials")
    .select("provider, last_four, is_active, config, updated_at")
    .eq("workspace_id", workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Never return secrets. config may contain non-secret settings (e.g. base_url).
  const byProvider: Record<string, unknown> = {}
  for (const row of (data || []) as any[]) {
    byProvider[row.provider] = {
      configured: true,
      last_four: row.last_four,
      is_active: row.is_active,
      config: row.config || {},
      updated_at: row.updated_at,
    }
  }
  const result = PROVIDERS.map((p) => ({
    provider: p,
    ...(byProvider[p] as object || { configured: false }),
  }))

  return NextResponse.json({ credentials: result })
}

/** PUT — save/update a credential secret + config. */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, provider, secret, config } = body
    if (!workspace_id || !provider || !PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: "workspace_id and valid provider required" }, { status: 400 })
    }
    if (!secret && !config) {
      return NextResponse.json({ error: "secret or config required" }, { status: 400 })
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const admin = createAdminClient()

    const payload: Record<string, unknown> = {
      workspace_id,
      provider,
      config: config || {},
      is_active: true,
      created_by: auth.userId,
    }
    if (secret) {
      payload.secret = secret
      payload.last_four = maskSecret(secret)
    }

    // If only updating config without a new secret, preserve existing secret.
    if (!secret) {
      const { data: existing } = await admin
        .from("integration_credentials")
        .select("secret, last_four")
        .eq("workspace_id", workspace_id)
        .eq("provider", provider)
        .maybeSingle()
      if (!existing) {
        return NextResponse.json(
          { error: "secret required for new credential" },
          { status: 400 }
        )
      }
      payload.secret = (existing as { secret: string }).secret
      payload.last_four = (existing as { last_four: string }).last_four
    }

    const { error } = await admin
      .from("integration_credentials")
      .upsert(payload, { onConflict: "workspace_id, provider" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, provider, last_four: payload.last_four })
  } catch (err) {
    console.error("credentials PUT error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/** DELETE — remove a credential. */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, provider } = body
    if (!workspace_id || !provider) {
      return NextResponse.json({ error: "workspace_id and provider required" }, { status: 400 })
    }

    const auth = await requireWorkspaceAdmin(workspace_id)
    if ("error" in auth) return auth.error

    const admin = createAdminClient()
    const { error } = await admin
      .from("integration_credentials")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("provider", provider)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("credentials DELETE error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
