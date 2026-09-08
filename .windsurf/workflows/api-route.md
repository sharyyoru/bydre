---
description: Create a Next.js API route with Supabase integration
---

## Context
API routes in Next.js App Router are created in `src/app/api/` as `route.ts` files.

## File Structure
```
src/app/api/
├── [feature]/
│   └── route.ts        # Main endpoint
│   └── [id]/
│       └── route.ts    # Detail endpoint
```

## Steps

### 1. Create route directory
```bash
mkdir -p src/app/api/[feature]
```

### 2. Create route.ts
```typescript
// src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - List or fetch
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const admin = createAdminClient()

    // Single item
    if (id) {
      const { data, error } = await admin
        .from("table_name")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return NextResponse.json({ item: data })
    }

    // List items
    const { data, error, count } = await admin
      .from("table_name")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      items: data,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[API] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    )
  }
}

// POST - Create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from("table_name")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error) {
    console.error("[API] POST error:", error)
    return NextResponse.json(
      { error: "Failed to create" },
      { status: 500 }
    )
  }
}

// PUT - Update
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("table_name")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[API] PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    )
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("table_name")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    )
  }
}
```

### 3. Create dynamic route (optional)
```typescript
// src/app/api/[feature]/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("table_name")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ item: data })
}
```

## Response Headers

### CORS (if needed)
```typescript
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type",
}

return NextResponse.json(data, { headers })
```

### Cache Control
```typescript
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
})
```

## Common Patterns

### With Authentication
```typescript
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Continue with authenticated user...
}
```

### With Workspace Context
```typescript
const workspaceId = searchParams.get("workspace_id")

const { data } = await admin
  .from("table_name")
  .select("*")
  .eq("workspace_id", workspaceId)
```

### With Filtering
```typescript
let query = admin.from("table_name").select("*")

if (status) query = query.eq("status", status)
if (search) query = query.ilike("name", `%${search}%`)
if (dateFrom) query = query.gte("created_at", dateFrom)
if (dateTo) query = query.lte("created_at", dateTo)

const { data } = await query
```

## Related
- `/supabase-migration` - Create table for this API
- `/deploy-vercel` - Deploy after creating API
