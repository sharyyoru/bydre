---
description: Work with the Owner Sheets system for property management
---

## Context
Owner Sheets tracks property owner contacts and their listings. Used by property management team to manage landlord relationships.

## Files Involved
- `src/components/owner-sheets/` - Owner sheets components
- `src/app/api/owner-sheets/` - API routes
- `supabase/migrations/0037_owner_sheets.sql` - Database schema

## Data Structure
```typescript
interface Owner {
  id: string
  created_at: string
  workspace_id: string
  
  // Owner Info
  name: string
  email: string
  phone: string
  nationality: string
  
  // Properties
  properties: Property[]
  
  // Status
  status: "active" | "inactive" | "pending"
  last_contact: string
  notes: string
}

interface Property {
  id: string
  owner_id: string
  
  // Property Details
  type: "apartment" | "villa" | "townhouse" | "penthouse"
  bedrooms: number
  location: string
  building_name: string
  
  // Listing Info
  listing_type: "sale" | "rent"
  price: number
  availability_date: string
  
  // Status
  status: "available" | "rented" | "sold" | "pending"
}
```

## Steps

### 1. Add Owner
```typescript
// src/app/api/owner-sheets/owners/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("owners")
    .insert({
      workspace_id: body.workspace_id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      nationality: body.nationality,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ owner: data })
}
```

### 2. Add Property to Owner
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("owner_properties")
    .insert({
      owner_id: body.owner_id,
      type: body.type,
      bedrooms: body.bedrooms,
      location: body.location,
      building_name: body.building_name,
      listing_type: body.listing_type,
      price: body.price,
      availability_date: body.availability_date,
      status: "available",
    })
    .select()
    .single()

  return NextResponse.json({ property: data })
}
```

### 3. Filter and Search Owners
```typescript
// GET /api/owner-sheets/owners?status=active&location=Dubai Marina
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspace_id")
  const status = searchParams.get("status")
  const location = searchParams.get("location")
  const search = searchParams.get("search")

  let query = createAdminClient()
    .from("owners")
    .select(`
      *,
      properties:owner_properties(*)
    `)
    .eq("workspace_id", workspaceId)

  if (status) query = query.eq("status", status)
  if (location) query = query.contains("properties.location", location)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, error } = await query.order("created_at", { ascending: false })

  return NextResponse.json({ owners: data || [] })
}
```

### 4. Export to Excel
```typescript
import ExcelJS from "exceljs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspace_id")

  const { data: owners } = await createAdminClient()
    .from("owners")
    .select(`*, properties:owner_properties(*)`)
    .eq("workspace_id", workspaceId)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Owners")

  sheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Email", key: "email", width: 25 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Properties", key: "property_count", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ]

  owners?.forEach((owner) => {
    sheet.addRow({
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      property_count: owner.properties?.length || 0,
      status: owner.status,
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=owners.xlsx",
    },
  })
}
```

### 5. Owner Sheets Table Component
```tsx
// src/components/owner-sheets/owner-sheets.tsx
"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"

export function OwnerSheets({ workspaceId }: { workspaceId: string }) {
  const [owners, setOwners] = useState<Owner[]>([])
  const [filters, setFilters] = useState({
    status: "",
    location: "",
    search: "",
  })

  useEffect(() => {
    fetchOwners()
  }, [filters])

  async function fetchOwners() {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      ...filters,
    })
    const res = await fetch(`/api/owner-sheets/owners?${params}`)
    const data = await res.json()
    setOwners(data.owners)
  }

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <DataTable
        columns={columns}
        data={owners}
        onRowClick={(owner) => openOwnerDetail(owner)}
      />
    </div>
  )
}
```

## Related
- `/crm-lead-feature` - Link leads to owner properties
- `/supabase-migration` - Modify owner sheets schema
