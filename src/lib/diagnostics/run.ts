import { GoogleGenAI } from "@google/genai"
import { getCredential, maskSecret } from "@/lib/social-monitor/credentials"
import { createAdminClient } from "@/lib/supabase/admin"

export interface ModelInfo {
  name: string
  displayName?: string
  actions: string[]
}

export interface TestResult {
  label: string
  target: string
  ok: boolean
  ms: number
  detail?: string
}

export interface DiagnosticsReport {
  generatedAt: string
  credential: {
    configured: boolean
    source: "database" | "environment" | "none"
    active: boolean
    masked: string | null
  }
  models: {
    total: number
    text: ModelInfo[]
    image: ModelInfo[]
    video: ModelInfo[]
    other: ModelInfo[]
    error?: string
  }
  tests: TestResult[]
  recommendations: string[]
}

const TEXT_CANDIDATES = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-pro"]

function stripPrefix(name?: string): string {
  return (name || "").replace(/^models\//, "")
}

/** Determine where the credential comes from and whether it is active. */
async function credentialStatus(workspaceId: string): Promise<DiagnosticsReport["credential"]> {
  const cred = await getCredential(workspaceId, "gemini")
  if (!cred) return { configured: false, source: "none", active: false, masked: null }

  let source: "database" | "environment" = "environment"
  let active = true
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("integration_credentials")
      .select("is_active")
      .eq("workspace_id", workspaceId)
      .eq("provider", "gemini")
      .maybeSingle()
    if (data) {
      source = "database"
      active = (data as { is_active: boolean }).is_active
    }
  } catch {
    // Service role unavailable — assume env fallback.
  }
  return { configured: true, source, active, masked: `…${maskSecret(cred.secret)}` }
}

/** Enumerate the models this API key can access, grouped by capability. */
async function listModels(ai: GoogleGenAI): Promise<DiagnosticsReport["models"]> {
  const text: ModelInfo[] = []
  const image: ModelInfo[] = []
  const video: ModelInfo[] = []
  const other: ModelInfo[] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pager = await ai.models.list({ config: { pageSize: 200, queryBase: true } as any })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const m of pager as any) {
      const name = stripPrefix(m?.name)
      if (!name) continue
      const actions: string[] = m?.supportedActions || m?.supportedGenerationMethods || []
      const info: ModelInfo = { name, displayName: m?.displayName, actions }
      if (/veo/i.test(name)) video.push(info)
      else if (/imagen/i.test(name)) image.push(info)
      else if (/embedding|embed/i.test(name)) other.push(info)
      else if (actions.some((a) => /generateContent/i.test(a)) || /gemini|gemma/i.test(name)) text.push(info)
      else other.push(info)
    }
    return { total: text.length + image.length + video.length + other.length, text, image, video, other }
  } catch (err) {
    return {
      total: 0,
      text,
      image,
      video,
      other,
      error: err instanceof Error ? err.message : "Failed to list models",
    }
  }
}

/** Live-test a tiny text generation against a model. */
async function testText(ai: GoogleGenAI, model: string): Promise<TestResult> {
  const start = Date.now()
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Reply with the single word: ok" }] }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: { maxOutputTokens: 5 } as any,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txt = (res as any)?.text || ""
    return { label: "Text generation", target: model, ok: true, ms: Date.now() - start, detail: (txt || "(empty)").slice(0, 40) }
  } catch (err) {
    return {
      label: "Text generation",
      target: model,
      ok: false,
      ms: Date.now() - start,
      detail: err instanceof Error ? err.message.slice(0, 200) : "failed",
    }
  }
}

function buildRecommendations(report: Omit<DiagnosticsReport, "recommendations">): string[] {
  const recs: string[] = []
  if (!report.credential.configured) {
    recs.push("No Google (Gemini) API key found. Add one under API Settings, or set GEMINI_API_KEY.")
    return recs
  }
  if (!report.credential.active) {
    recs.push("The stored Gemini credential is marked inactive — enable it in API Settings.")
  }
  if (report.models.error) {
    recs.push(`Could not list models: ${report.models.error}. The key may be invalid or lack API access.`)
  }

  const workingText = report.tests.filter((t) => t.ok).map((t) => t.target)
  if (workingText.length) {
    recs.push(`DreAgent chat works with: ${workingText.join(", ")}. Set the default to ${workingText[0]}.`)
  } else if (report.tests.length) {
    recs.push("No text model responded successfully — the key may not have Gemini text access on its tier.")
  }

  if (report.models.video.length) {
    recs.push(`Veo video models available: ${report.models.video.map((m) => m.name).join(", ")}.`)
  } else {
    recs.push("No Veo video models are available to this key (Veo often requires allowlisting / a paid tier).")
  }
  if (report.models.image.length) {
    recs.push(`Imagen image models available: ${report.models.image.map((m) => m.name).join(", ")}.`)
  }
  return recs
}

/** Run the full diagnostic suite for a workspace. */
export async function runDiagnostics(workspaceId: string): Promise<DiagnosticsReport> {
  const credential = await credentialStatus(workspaceId)
  const generatedAt = new Date().toISOString()

  if (!credential.configured) {
    const base = {
      generatedAt,
      credential,
      models: { total: 0, text: [], image: [], video: [], other: [] },
      tests: [] as TestResult[],
    }
    return { ...base, recommendations: buildRecommendations(base) }
  }

  const cred = await getCredential(workspaceId, "gemini")
  const ai = new GoogleGenAI({ apiKey: cred!.secret })

  const models = await listModels(ai)

  // Live-test text candidates that actually appear available (fall back to the
  // static list if enumeration failed), capping at 4 to keep it fast.
  const availableNames = new Set(models.text.map((m) => m.name))
  const toTest = TEXT_CANDIDATES.filter((m) => availableNames.has(m))
  const testList = (toTest.length ? toTest : TEXT_CANDIDATES).slice(0, 4)
  const tests: TestResult[] = []
  for (const model of testList) tests.push(await testText(ai, model))

  const base = { generatedAt, credential, models, tests }
  return { ...base, recommendations: buildRecommendations(base) }
}
