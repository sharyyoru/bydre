---
description: Add a feature to the DreCrypto property detail page
---

## Context
Use this workflow to add new features to the property detail page at `/drecrypto/property/[id]`.
Current features: Image Gallery, Price Chart, Payment Plan, Location Map, Offer Form.

## Prerequisites
- Property page: `src/app/drecrypto/property/[id]/page.tsx`
- Components: `src/components/drecrypto/`

## Property Interface
```typescript
interface Property {
  id: number
  name: string
  developer: string
  location: string
  type: "off-plan" | "ready"
  status: string | null
  priceAed: number
  priceAedMax?: number
  priceBtc: number
  priceEth: number
  priceUsdt: number
  beds: string
  baths: string
  sqft: string
  handover: string | null
  description: string | null
  images: string[]
  amenities: string[]
  latitude: number | null
  longitude: number | null
}
```

## Steps

### 1. Create the component file
```tsx
// src/components/drecrypto/[feature-name].tsx
"use client"

import { SomeIcon } from "lucide-react"

interface FeatureNameProps {
  property: Property  // or specific props needed
}

export function FeatureName({ property }: FeatureNameProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-medium flex items-center gap-2 mb-4">
        <SomeIcon className="h-5 w-5 text-[#C9A962]" />
        Feature Title
      </h3>
      
      {/* Feature content */}
    </div>
  )
}
```

### 2. Export from index.ts
Add to `src/components/drecrypto/index.ts`:
```typescript
export { FeatureName } from "./[feature-name]"
```

### 3. Import in property page
Add import in `src/app/drecrypto/property/[id]/page.tsx`:
```typescript
import { FeatureName } from "@/components/drecrypto/[feature-name]"
```

### 4. Add to a tab or section
Option A - Add to existing tab:
```tsx
{activeTab === "overview" && (
  <>
    {/* existing content */}
    <FeatureName property={property} />
  </>
)}
```

Option B - Add new tab:
```tsx
// Add to tab navigation array
{ key: "feature", label: "Feature Name", icon: SomeIcon }

// Add tab content
{activeTab === "feature" && (
  <FeatureName property={property} />
)}
```

## Existing Components to Reference
| Component | File | Purpose |
|-----------|------|---------|
| ImageGallery | `image-gallery.tsx` | Lightbox with thumbnails |
| PriceChart | `price-chart.tsx` | Recharts area/bar charts |
| PaymentPlan | `payment-plan.tsx` | Timeline with milestones |
| LocationMap | `location-map.tsx` | Map with nearby places |
| CryptoConverter | `crypto-converter.tsx` | AED ↔ BTC/USDT converter |
| OfferForm | `offer-form.tsx` | Submit crypto offer form |

## Common Patterns

### Using Currency Context
```tsx
import { useCurrency } from "@/components/drecrypto/currency-context"

const { currency, formatPrice, getCurrencyColor } = useCurrency()
```

### Bitcoin Formatting
```tsx
const formatBtc = (btc: number) => {
  if (btc < 1) return `${(btc * 1000).toFixed(2)} mBTC`
  return `${btc.toFixed(2)} BTC`
}
```

### AED Formatting
```tsx
const formatPrice = (price: number) => 
  new Intl.NumberFormat("en-AE").format(price)
```

## Related
- `/drecrypto-component` - General component creation
- `/drecrypto-api-endpoint` - If feature needs API data
