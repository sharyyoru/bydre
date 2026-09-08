---
description: Create a new DreCrypto component with proper styling
---

## Context
DreCrypto uses a dark theme with gold accents. All components should follow this design system.

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0a` | Page background |
| Card BG | `white/5` | Card backgrounds |
| Border | `white/10` | Card borders |
| Gold | `#C9A962` | Accents, CTAs, highlights |
| Bitcoin | `#F7931A` | BTC price displays |
| USDT | `#26A17B` | USDT/Tether displays |
| Text Primary | `white` | Headings |
| Text Secondary | `white/70` | Body text |
| Text Muted | `white/50` | Labels, hints |

### Common Classes
```tsx
// Card
"bg-white/5 border border-white/10 rounded-xl p-6"

// Gold accent border
"border-l-4 border-[#C9A962]"

// Button primary
"bg-[#C9A962] hover:bg-[#b8994d] text-black font-medium"

// Button outline
"border border-white/20 text-white hover:bg-white/10"

// Section heading
"text-xl font-light text-white mb-4"

// Price display
"text-2xl lg:text-3xl font-light"
```

## Steps

### 1. Create component file
```tsx
// src/components/drecrypto/[component-name].tsx
"use client"

import { useState } from "react"
import { SomeIcon } from "lucide-react"

interface ComponentNameProps {
  prop1: string
  prop2?: number
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  const [state, setState] = useState(false)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <SomeIcon className="h-5 w-5 text-[#C9A962]" />
          Component Title
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <p className="text-white/70">{prop1}</p>
      </div>

      {/* Action */}
      <button className="mt-4 w-full py-3 bg-[#C9A962] hover:bg-[#b8994d] text-black font-medium rounded-lg transition-colors">
        Action Button
      </button>
    </div>
  )
}
```

### 2. Export from index
Add to `src/components/drecrypto/index.ts`:
```typescript
export { ComponentName } from "./[component-name]"
```

### 3. Use in pages
```tsx
import { ComponentName } from "@/components/drecrypto"

<ComponentName prop1="value" prop2={123} />
```

## Common Patterns

### Loading State
```tsx
import { Loader2 } from "lucide-react"

{loading && (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-8 w-8 text-[#C9A962] animate-spin" />
  </div>
)}
```

### Empty State
```tsx
<div className="text-center py-12">
  <SomeIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
  <p className="text-white/50">No items found</p>
</div>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id} item={item} />
  ))}
</div>
```

### Responsive Price Display
```tsx
<div className="flex items-center gap-2">
  <Bitcoin className="h-6 w-6 text-[#F7931A]" />
  <span className="text-2xl lg:text-3xl font-light text-white">
    {formatBtc(priceBtc)}
  </span>
</div>
<p className="text-white/50 text-sm">
  AED {formatAed(priceAed)}
</p>
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge"

<Badge className={type === "off-plan" ? "bg-purple-600" : "bg-green-600"}>
  {type === "off-plan" ? "Off-Plan" : "Ready"}
</Badge>
```

## Icons (Lucide)
Common icons used in DreCrypto:
- `Bitcoin` - Crypto prices
- `MapPin` - Location
- `Bed`, `Bath`, `Maximize` - Property specs
- `Calendar` - Handover dates
- `Building2` - Developer/property
- `TrendingUp`, `TrendingDown` - Price changes
- `Phone`, `MessageCircle` - Contact
- `Heart`, `Share2` - Actions
- `ChevronLeft`, `ChevronRight` - Navigation

## Related
- `/drecrypto-add-page` - Add page that uses this component
- `/add-ui-component` - Add shadcn/ui base components
