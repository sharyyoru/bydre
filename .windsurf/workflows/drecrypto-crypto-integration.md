---
description: Add cryptocurrency features to DreCrypto platform
---

## Context
DreCrypto allows users to view property prices in BTC/USDT and submit offers in cryptocurrency. This workflow covers adding crypto-related features.

## Current Crypto Infrastructure

### Price Context
`src/components/drecrypto/crypto-price-context.tsx`
- Fetches live BTC/ETH/USDT prices from CoinGecko
- Auto-refreshes every 60 seconds
- Provides conversion functions

### Currency Toggle
`src/components/drecrypto/currency-context.tsx`
- Toggle between BTC and USDT display
- `useCurrency()` hook for components

### Offer System
`src/app/api/drecrypto/offers/route.ts`
- Stores offers in `crypto_offers` table
- Records: property_id, wallet_address, amount, currency, status

## Adding Price Display

### Use Currency Context
```tsx
"use client"

import { useCurrency } from "@/components/drecrypto/currency-context"
import { Bitcoin, DollarSign } from "lucide-react"

export function PriceDisplay({ priceBtc, priceUsdt }: Props) {
  const { currency, formatPrice, getCurrencyColor } = useCurrency()

  return (
    <div className="flex items-center gap-2" style={{ color: getCurrencyColor() }}>
      {currency === "BTC" ? (
        <Bitcoin className="h-6 w-6" />
      ) : (
        <DollarSign className="h-6 w-6" />
      )}
      <span className="text-2xl font-bold">
        {formatPrice(priceBtc, priceUsdt)}
      </span>
    </div>
  )
}
```

### Currency Toggle Button
```tsx
import { useCurrency } from "@/components/drecrypto/currency-context"

const { currency, toggleCurrency } = useCurrency()

<button
  onClick={toggleCurrency}
  className="px-3 py-1 rounded-full bg-white/10 text-white text-sm"
>
  {currency === "BTC" ? "BTC" : "USDT"}
</button>
```

## Adding Crypto Conversion

### Use Crypto Prices
```tsx
"use client"

import { useCryptoPrices } from "@/components/drecrypto/crypto-price-context"

export function Converter() {
  const { prices, loading } = useCryptoPrices()
  
  const convertAedToBtc = (aed: number) => {
    if (!prices?.btc) return 0
    return aed / prices.btc
  }
  
  const convertAedToUsdt = (aed: number) => {
    if (!prices?.usdt) return 0
    return aed / prices.usdt
  }

  return (
    // converter UI
  )
}
```

## Adding Offer Submission

### Offer Form Pattern
```tsx
"use client"

import { useState } from "react"

interface OfferFormProps {
  propertyId: number
  propertyName: string
  priceAed: number
}

export function OfferForm({ propertyId, propertyName, priceAed }: OfferFormProps) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<"BTC" | "USDT">("BTC")
  const [walletAddress, setWalletAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch("/api/drecrypto/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          property_name: propertyName,
          offer_amount: parseFloat(amount),
          currency,
          wallet_address: walletAddress,
          asking_price_aed: priceAed,
        }),
      })

      if (res.ok) {
        // Success handling
      }
    } catch (error) {
      console.error("Offer submission failed:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## Database Schema

### crypto_offers table
```sql
CREATE TABLE crypto_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  property_id TEXT NOT NULL,
  property_name TEXT,
  offer_amount DECIMAL NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT', 'ETH')),
  wallet_address TEXT,
  asking_price_aed DECIMAL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending'
);
```

## Formatting Helpers

### Bitcoin Amount
```typescript
const formatBtc = (btc: number) => {
  if (btc < 1) return `${(btc * 1000).toFixed(2)} mBTC`
  return `${btc.toFixed(2)} BTC`
}
```

### USDT Amount
```typescript
const formatUsdt = (usdt: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usdt)
}
```

### AED Amount
```typescript
const formatAed = (aed: number) => {
  return new Intl.NumberFormat("en-AE").format(aed)
}
```

## Related
- `/supabase-migration` - Create crypto_offers table
- `/drecrypto-api-endpoint` - Create offers API
