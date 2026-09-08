---
description: Get full context on DreHomes/bydre project architecture
---

## Project Overview

**DreHomes (bydre)** is a real estate management platform for Dubai property marketing and sales teams.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Icons**: Lucide React

## Key Modules

### 1. DreCrypto (`/drecrypto`)
Crypto-enabled property listings platform.
- **Purpose**: Display properties with BTC/USDT prices, accept crypto offers
- **External APIs**: GenieMap (properties), CoinGecko (prices), Meta (Instagram)
- **Files**: `src/app/drecrypto/`, `src/components/drecrypto/`

### 2. CRM Board System (`/workspace/[id]/board`)
Monday.com-style task management.
- **Purpose**: Track tasks, leads, deals with customizable columns
- **Features**: Drag-drop, automations, notifications
- **Files**: `src/components/board/`, `src/app/workspace/`

### 3. Owner Sheets (`/workspace/[id]/owner-sheets`)
Property owner contact management.
- **Purpose**: Track landlord contacts and their properties
- **Files**: `src/components/owner-sheets/`

### 4. Sales Brain (`/workspace/[id]/sales-brain`)
Sales analytics and commissions.
- **Purpose**: Track sales performance, calculate commissions
- **Files**: `src/components/sales-brain/`

### 5. Social Monitor
Instagram/social media monitoring.
- **Purpose**: Track brand mentions, sentiment analysis
- **Files**: `src/components/social-monitor/`

### 6. Compliance Hub
RERA compliance tracking.
- **Purpose**: Track permit expiries, manage QR codes
- **Files**: `src/components/compliance/`

## Directory Structure
```
src/
├── app/
│   ├── api/              # API routes
│   ├── drecrypto/        # DreCrypto pages
│   ├── workspace/[id]/   # Workspace pages
│   └── ...
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── drecrypto/        # DreCrypto components
│   ├── board/            # Board system components
│   └── ...
├── lib/
│   └── supabase/         # Supabase client setup
└── ...

supabase/
└── migrations/           # Database migrations (0001-0043+)
```

## External Integrations

| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| GenieMap | Property data | `GENIEMAP_API_TOKEN` env var |
| CoinGecko | Crypto prices | Public API (no key) |
| Meta/Instagram | Social posts | `integration_credentials` table |
| Supabase | Database/Auth | `SUPABASE_*` env vars |

## Database Tables (Key)

| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant workspaces |
| `workspace_members` | User access to workspaces |
| `boards` | Board definitions |
| `board_items` | Items/tasks in boards |
| `board_groups` | Groups within boards |
| `notifications` | User notifications |
| `integration_credentials` | API keys per workspace |
| `crypto_offers` | DreCrypto property offers |
| `owners` | Owner sheets contacts |
| `owner_properties` | Owner property listings |

## Common Patterns

### API Route Structure
```typescript
// src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const { data } = await admin.from("table").select("*")
  return NextResponse.json({ data })
}
```

### Client Component Structure
```tsx
// src/components/[module]/[component].tsx
"use client"

import { useState, useEffect } from "react"

export function Component({ prop }: Props) {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/endpoint")
      .then(res => res.json())
      .then(data => setData(data))
  }, [])

  return <div>{/* UI */}</div>
}
```

### Design Tokens (DreCrypto)
- Background: `#0a0a0a`
- Gold accent: `#C9A962`
- Card: `bg-white/5 border border-white/10`

### Design Tokens (CRM)
- Uses shadcn/ui defaults
- Light/dark mode support
- Workspace branding colors

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Check for errors |
| `npx tsc --noEmit` | TypeScript check |
| `git push origin master` | Deploy to Vercel |

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GENIEMAP_API_TOKEN=xxx
```

## Useful Links
- **Production**: https://bydre.vercel.app
- **DreCrypto**: https://bydre.vercel.app/drecrypto
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com/dashboard

## Getting Help
Use these workflows:
- `/debug-issue` - Debug problems
- `/fix-build-errors` - Fix build failures
- `/drecrypto-*` - DreCrypto features
- `/crm-*` - CRM features
- `/supabase-migration` - Database changes
- `/deploy-vercel` - Deployment
