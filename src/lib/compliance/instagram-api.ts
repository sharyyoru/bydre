import { InstagramMediaResponse, InstagramUserResponse, MediaType } from "./types"

/**
 * Instagram Graph API client for compliance monitoring.
 * Uses Meta Graph API to fetch user media and profile info.
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0"
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`

export class InstagramApiError extends Error {
  status: number
  code?: string
  
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "InstagramApiError"
    this.status = status
    this.code = code
  }
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_URL}/${path}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  
  if (!res.ok) {
    const errorMessage = json?.error?.message || `Graph API error: ${res.status}`
    const errorCode = json?.error?.code?.toString()
    throw new InstagramApiError(errorMessage, res.status, errorCode)
  }
  
  return json as T
}

/**
 * Get Instagram user profile info
 */
export async function getInstagramUser(
  igUserId: string,
  accessToken: string
): Promise<InstagramUserResponse> {
  return graphGet<InstagramUserResponse>(igUserId, {
    fields: "id,username,name,profile_picture_url",
    access_token: accessToken,
  })
}

/**
 * Validate access token and get connected Instagram accounts
 */
export async function validateAndGetAccounts(
  accessToken: string
): Promise<{ pages: { id: string; name: string; instagram_business_account?: { id: string } }[] }> {
  // First get user's pages
  const pagesRes = await graphGet<{ data: { id: string; name: string; access_token: string }[] }>(
    "me/accounts",
    {
      fields: "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}",
      access_token: accessToken,
    }
  )
  
  return { pages: pagesRes.data || [] }
}

/**
 * Get Instagram business account ID from a Facebook page
 */
export async function getInstagramBusinessAccount(
  pageId: string,
  accessToken: string
): Promise<InstagramUserResponse | null> {
  try {
    const res = await graphGet<{ instagram_business_account?: InstagramUserResponse }>(
      pageId,
      {
        fields: "instagram_business_account{id,username,name,profile_picture_url}",
        access_token: accessToken,
      }
    )
    return res.instagram_business_account || null
  } catch {
    return null
  }
}

/**
 * Fetch recent media from an Instagram business account
 */
export async function fetchUserMedia(
  igUserId: string,
  accessToken: string,
  options: {
    limit?: number
    since?: Date
    after?: string // pagination cursor
  } = {}
): Promise<{ media: InstagramMediaResponse[]; nextCursor?: string }> {
  const { limit = 25, since, after } = options
  
  const params: Record<string, string> = {
    fields: "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{id,media_type,media_url}",
    limit: String(limit),
    access_token: accessToken,
  }
  
  if (since) {
    params.since = Math.floor(since.getTime() / 1000).toString()
  }
  
  if (after) {
    params.after = after
  }
  
  const res = await graphGet<{
    data: InstagramMediaResponse[]
    paging?: { cursors?: { after?: string } }
  }>(`${igUserId}/media`, params)
  
  return {
    media: res.data || [],
    nextCursor: res.paging?.cursors?.after,
  }
}

/**
 * Fetch a single media item with full details
 */
export async function fetchMediaDetails(
  mediaId: string,
  accessToken: string
): Promise<InstagramMediaResponse> {
  return graphGet<InstagramMediaResponse>(mediaId, {
    fields: "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{id,media_type,media_url}",
    access_token: accessToken,
  })
}

/**
 * Get all carousel children media URLs
 */
export async function fetchCarouselChildren(
  mediaId: string,
  accessToken: string
): Promise<{ id: string; media_type: MediaType; media_url?: string }[]> {
  const res = await graphGet<{
    data: { id: string; media_type: MediaType; media_url?: string }[]
  }>(`${mediaId}/children`, {
    fields: "id,media_type,media_url",
    access_token: accessToken,
  })
  
  return res.data || []
}

/**
 * Exchange short-lived token for long-lived token
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const url = new URL(`${GRAPH_URL}/oauth/access_token`)
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("fb_exchange_token", shortLivedToken)
  
  const res = await fetch(url.toString())
  const json = await res.json()
  
  if (!res.ok) {
    throw new InstagramApiError(
      json?.error?.message || "Token exchange failed",
      res.status
    )
  }
  
  return json
}

/**
 * Refresh a long-lived token before it expires
 */
export async function refreshLongLivedToken(
  longLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const url = new URL(`${GRAPH_URL}/oauth/access_token`)
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("fb_exchange_token", longLivedToken)
  
  const res = await fetch(url.toString())
  const json = await res.json()
  
  if (!res.ok) {
    throw new InstagramApiError(
      json?.error?.message || "Token refresh failed",
      res.status
    )
  }
  
  return json
}

/**
 * Check if a token is still valid
 */
export async function validateToken(
  accessToken: string
): Promise<{ valid: boolean; expires_at?: number; scopes?: string[] }> {
  try {
    const res = await graphGet<{
      data: {
        is_valid: boolean
        expires_at?: number
        scopes?: string[]
      }
    }>("debug_token", {
      input_token: accessToken,
      access_token: accessToken,
    })
    
    return {
      valid: res.data?.is_valid || false,
      expires_at: res.data?.expires_at,
      scopes: res.data?.scopes,
    }
  } catch {
    return { valid: false }
  }
}
