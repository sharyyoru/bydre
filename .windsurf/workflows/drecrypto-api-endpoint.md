---
description: Create an API endpoint for DreCrypto platform
---

## Context
DreCrypto API routes handle property data (GenieMap), crypto prices (CoinGecko), Instagram feed (Meta), and crypto offers (Supabase).

## Prerequisites
- API routes at `src/app/api/drecrypto/`
- Supabase admin client available

## Steps

### 1. Create the route file
```typescript
// src/app/api/drecrypto/[endpoint]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Optional: Cache configuration
let cache: { data: any; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000  // 10 minutes
const STALE_DURATION = 30 * 60 * 1000  // 30 minutes (serve stale while refresh)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const param = searchParams.get("param")

    // Check cache
    const now = Date.now()
    if (cache && (now - cache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({ data: cache.data, cached: true })
    }

    // Fetch data
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("table_name")
      .select("*")
      .eq("column", param)

    if (error) throw error

    // Update cache
    cache = { data, timestamp: now }

    return NextResponse.json({ data, cached: false })
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("table_name")
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json(
      { error: "Failed to create" },
      { status: 500 }
    )
  }
}
```

## Existing API Patterns

### Properties API (GenieMap)
`src/app/api/drecrypto/properties/route.ts`
- Fetches from GenieMap API
- Transforms to CryptoProperty interface
- Includes crypto price conversion
- Has fallback data for cold starts

### Instagram Feed API
`src/app/api/drecrypto/instagram/route.ts`
- Fetches from Meta Graph API
- Gets credentials from Supabase
- Returns fallback posts on error

### Crypto Prices API
`src/app/api/drecrypto/prices/route.ts`
- Fetches BTC/ETH/USDT from CoinGecko
- 60-second cache
- Used by CryptoPriceContext

### Offers API
`src/app/api/drecrypto/offers/route.ts`
- Stores crypto offers in Supabase
- Links to property_id
- Records wallet address, amount, currency

## External API Integrations

### GenieMap (Properties)
```typescript
const response = await fetch(
  `https://api.geniemap.net/api/projects?workspace_slug=drehomes`,
  { headers: { "Authorization": `Bearer ${token}` } }
)
```

### CoinGecko (Crypto Prices)
```typescript
const response = await fetch(
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=aed"
)
```

### Meta Graph API (Instagram)
```typescript
const response = await fetch(
  `https://graph.facebook.com/v18.0/${accountId}/media?fields=id,caption,media_url,permalink,timestamp,media_type,thumbnail_url&limit=8&access_token=${token}`
)
```

## Response Patterns

### Success with cache status
```json
{
  "data": [...],
  "cached": true,
  "total": 50
}
```

### Error response
```json
{
  "error": "Failed to fetch",
  "message": "Detailed error message"
}
```

### Paginated response
```json
{
  "properties": [...],
  "total": 150,
  "offset": 0,
  "limit": 50
}
```

## Related
- `/supabase-migration` - Create database tables for the API
- `/drecrypto-component` - Create component that consumes this API
