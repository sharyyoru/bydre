import { getCredential } from "./credentials"
import { NotConfiguredError, RegistrationType } from "./types"

export interface MarketMetricInput {
  workspace_id: string
  area_name: string
  property_type: string | null
  registration_type: RegistrationType
  transaction_count: number
  total_value_aed: number
  avg_value_aed: number
  median_value_aed: number | null
  roi_percent: number | null
  period_start: string
  period_end: string
  source: string
  raw: Record<string, unknown>
}

export interface FetchMarketParams {
  workspaceId: string
  periodStart: string
  periodEnd: string
  areas?: string[]
}

/**
 * Fetch DLD transaction metrics from Dubai Pulse.
 *
 * NOTE: The exact Dubai Pulse dataset endpoint/auth format must be confirmed with the
 * user's credential. The base URL and any dataset id are read from the stored `config`
 * (config.base_url, config.dataset). This adapter normalizes the response into
 * MarketMetricInput rows. Adjust the parsing block once the real payload shape is known.
 */
export async function fetchMarketMetrics(
  params: FetchMarketParams
): Promise<MarketMetricInput[]> {
  const cred = await getCredential(params.workspaceId, "dubai_pulse")
  if (!cred) throw new NotConfiguredError("dubai_pulse")

  const baseUrl =
    (cred.config.base_url as string | undefined) || process.env.DUBAI_PULSE_BASE_URL
  if (!baseUrl) {
    throw new Error(
      "Dubai Pulse base_url not set. Add it in API Settings (config.base_url)."
    )
  }

  const url = new URL(baseUrl)
  url.searchParams.set("start", params.periodStart)
  url.searchParams.set("end", params.periodEnd)
  if (params.areas?.length) url.searchParams.set("areas", params.areas.join(","))

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${cred.secret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Dubai Pulse request failed: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as unknown
  return normalizeDubaiPulse(json, params)
}

/**
 * Normalize a Dubai Pulse payload into MarketMetricInput rows.
 * Defensive: tolerates common shapes ({ records: [...] } or a raw array) and
 * a variety of field names. Returns [] if nothing parseable is found.
 */
function normalizeDubaiPulse(
  payload: unknown,
  params: FetchMarketParams
): MarketMetricInput[] {
  const records: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.records)
    ? (payload as any).records
    : Array.isArray((payload as any)?.data)
    ? (payload as any).data
    : []

  return records
    .map((r) => {
      const area = r.area_name ?? r.area ?? r.location ?? r.master_project ?? "Unknown"
      const isOffPlan =
        String(r.registration_type ?? r.reg_type ?? r.type ?? "")
          .toLowerCase()
          .includes("off")
      const count = Number(r.transaction_count ?? r.count ?? r.transactions ?? 0)
      const total = Number(r.total_value_aed ?? r.total_value ?? r.amount ?? 0)
      const avg = Number(
        r.avg_value_aed ?? r.avg_value ?? (count ? total / count : 0)
      )
      return {
        workspace_id: params.workspaceId,
        area_name: String(area),
        property_type: r.property_type ?? r.property_sub_type ?? null,
        registration_type: (isOffPlan ? "off_plan" : "ready") as RegistrationType,
        transaction_count: Number.isFinite(count) ? count : 0,
        total_value_aed: Number.isFinite(total) ? total : 0,
        avg_value_aed: Number.isFinite(avg) ? avg : 0,
        median_value_aed:
          r.median_value_aed != null ? Number(r.median_value_aed) : null,
        roi_percent: r.roi_percent != null ? Number(r.roi_percent) : null,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        source: "dubai_pulse",
        raw: r,
      } as MarketMetricInput
    })
    .filter((row) => row.area_name && row.area_name !== "Unknown")
}
