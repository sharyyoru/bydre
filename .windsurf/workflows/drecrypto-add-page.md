---
description: Add a new page to the DreCrypto crypto real estate platform
---

## Context
Use this workflow when adding a new page to DreCrypto (e.g., /drecrypto/sellers, /drecrypto/mortgage).

## Prerequisites
- DreCrypto layout exists at `src/app/drecrypto/layout.tsx`
- Header navigation in `src/components/drecrypto/header.tsx`

## Steps

### 1. Create the page directory and file
```bash
mkdir src/app/drecrypto/[page-name]
```

### 2. Create page.tsx with DreCrypto styling
```tsx
// src/app/drecrypto/[page-name]/page.tsx
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Title | DreCrypto",
  description: "Page description for SEO",
}

export default function PageName() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl lg:text-5xl font-light text-white mb-6">
          Page Title
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Page subtitle or description
        </p>
      </section>

      {/* Content Sections */}
      <section className="container mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
          {/* Your content here */}
        </div>
      </section>
    </div>
  )
}
```

### 3. Add navigation link to header
Edit `src/components/drecrypto/header.tsx`:
```tsx
const navLinks = [
  // ... existing links
  { href: "/drecrypto/[page-name]", label: "Page Label" },
]
```

### 4. Test the page
// turbo
```bash
npm run dev
```
Visit http://localhost:3000/drecrypto/[page-name]

## Design Tokens
- **Background**: `bg-[#0a0a0a]`
- **Gold Accent**: `text-[#C9A962]` or `border-[#C9A962]`
- **Card Background**: `bg-white/5 border border-white/10`
- **Text Primary**: `text-white`
- **Text Secondary**: `text-white/70`
- **Text Muted**: `text-white/50`

## Examples
Existing pages to reference:
- `/drecrypto/buy/page.tsx` - Property listings with filters
- `/drecrypto/faq/page.tsx` - Accordion-based FAQ
- `/drecrypto/how-it-works/page.tsx` - Step-by-step process

## Related
- `/drecrypto-component` - Create reusable component
- `/drecrypto-api-endpoint` - Create API for the page
