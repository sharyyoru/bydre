import { NextResponse } from "next/server"

interface CryptoPrice {
  btc: number
  eth: number
  usdt: number
  updated_at: string
}

let cachedPrices: CryptoPrice | null = null
let lastFetch: number = 0
const CACHE_DURATION = 60000 // 60 seconds

export async function GET() {
  try {
    const now = Date.now()
    
    // Return cached if valid
    if (cachedPrices && (now - lastFetch) < CACHE_DURATION) {
      return NextResponse.json(cachedPrices)
    }

    // Fetch from CoinGecko
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=aed",
      { 
        headers: { "Accept": "application/json" },
        next: { revalidate: 60 }
      }
    )

    if (!res.ok) {
      // Return cached even if stale, or fallback prices
      if (cachedPrices) {
        return NextResponse.json(cachedPrices)
      }
      // Fallback prices if API fails and no cache
      return NextResponse.json({
        btc: 350000, // ~$95k USD in AED
        eth: 13000,  // ~$3.5k USD in AED
        usdt: 3.67,  // 1 USD ≈ 3.67 AED
        updated_at: new Date().toISOString(),
        fallback: true
      })
    }

    const data = await res.json()
    
    cachedPrices = {
      btc: data.bitcoin?.aed || 350000,
      eth: data.ethereum?.aed || 13000,
      usdt: data.tether?.aed || 3.67,
      updated_at: new Date().toISOString()
    }
    lastFetch = now

    return NextResponse.json(cachedPrices)
  } catch (error) {
    console.error("Error fetching crypto prices:", error)
    
    // Return cached or fallback
    if (cachedPrices) {
      return NextResponse.json(cachedPrices)
    }
    
    return NextResponse.json({
      btc: 350000,
      eth: 13000,
      usdt: 3.67,
      updated_at: new Date().toISOString(),
      fallback: true
    })
  }
}
