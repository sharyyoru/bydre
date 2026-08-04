import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET - List QR codes for a workspace
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id")
  const type = request.nextUrl.searchParams.get("type") // "company" or "project"
  
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  let query = supabase
    .from("compliance_qr_codes")
    .select(`
      *,
      project:geniemap_projects(id, name, developer_name)
    `)
    .eq("workspace_id", workspaceId)
    .order("type", { ascending: true })
    .order("name", { ascending: true })
  
  if (type) {
    query = query.eq("type", type)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ qr_codes: data })
}

/**
 * POST - Register a new QR code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, type, project_id, name, image_url, qr_data, description } = body
    
    if (!workspace_id || !type || !name) {
      return NextResponse.json(
        { error: "workspace_id, type, and name are required" },
        { status: 400 }
      )
    }
    
    if (type !== "company" && type !== "project") {
      return NextResponse.json(
        { error: "type must be 'company' or 'project'" },
        { status: 400 }
      )
    }
    
    if (type === "project" && !project_id) {
      return NextResponse.json(
        { error: "project_id is required for project QR codes" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check admin permission
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()
    
    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    // For company QR, check if one already exists
    if (type === "company") {
      const { data: existing } = await supabase
        .from("compliance_qr_codes")
        .select("id")
        .eq("workspace_id", workspace_id)
        .eq("type", "company")
        .eq("is_active", true)
        .maybeSingle()
      
      if (existing) {
        return NextResponse.json(
          { error: "A company QR code already exists. Deactivate it first." },
          { status: 409 }
        )
      }
    }
    
    const { data, error } = await supabase
      .from("compliance_qr_codes")
      .insert({
        workspace_id,
        type,
        project_id: type === "project" ? project_id : null,
        name,
        image_url: image_url || null,
        qr_data: qr_data || null,
        description: description || null,
        is_active: true,
      })
      .select(`
        *,
        project:geniemap_projects(id, name, developer_name)
      `)
      .single()
    
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A QR code for this project already exists" },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ qr_code: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update a QR code
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, workspace_id, name, image_url, qr_data, description, is_active } = body
    
    if (!id || !workspace_id) {
      return NextResponse.json(
        { error: "id and workspace_id are required" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check admin permission
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()
    
    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (image_url !== undefined) updates.image_url = image_url
    if (qr_data !== undefined) updates.qr_data = qr_data
    if (description !== undefined) updates.description = description
    if (is_active !== undefined) updates.is_active = is_active
    
    const { data, error } = await supabase
      .from("compliance_qr_codes")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspace_id)
      .select(`
        *,
        project:geniemap_projects(id, name, developer_name)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ qr_code: data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deactivate a QR code
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, workspace_id } = body
    
    if (!id || !workspace_id) {
      return NextResponse.json(
        { error: "id and workspace_id are required" },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check admin permission
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()
    
    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    // Soft delete by deactivating
    const { error } = await supabase
      .from("compliance_qr_codes")
      .update({ is_active: false })
      .eq("id", id)
      .eq("workspace_id", workspace_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
