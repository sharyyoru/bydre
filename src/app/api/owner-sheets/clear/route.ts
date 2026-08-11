import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes

// POST - Clear all owner sheets data for workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id } = body

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member || !["admin", "owner"].includes(member.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const admin = createAdminClient()

    // Step 1: Clear duplicate_of references
    await admin
      .from("owner_contacts")
      .update({ duplicate_of: null })
      .eq("workspace_id", workspace_id)
      .not("duplicate_of", "is", null)

    // Step 2: Delete contacts in batches
    let totalDeleted = 0
    let batchSize = 5000
    let keepDeleting = true

    while (keepDeleting) {
      const { data: batch } = await admin
        .from("owner_contacts")
        .select("id")
        .eq("workspace_id", workspace_id)
        .limit(batchSize)

      if (!batch || batch.length === 0) {
        keepDeleting = false
        break
      }

      const ids = batch.map(r => r.id)
      const { error } = await admin
        .from("owner_contacts")
        .delete()
        .in("id", ids)

      if (error) {
        console.error("Delete batch error:", error)
        return NextResponse.json({ 
          error: "Failed during deletion", 
          deleted: totalDeleted 
        }, { status: 500 })
      }

      totalDeleted += ids.length
      console.log(`Deleted ${totalDeleted} contacts...`)
    }

    // Step 3: Delete upload batches
    const { error: uploadError } = await admin
      .from("owner_sheets_uploads")
      .delete()
      .eq("workspace_id", workspace_id)

    if (uploadError) {
      console.error("Delete uploads error:", uploadError)
    }

    return NextResponse.json({ 
      success: true, 
      deleted_contacts: totalDeleted,
      message: `Cleared ${totalDeleted} contacts`
    })
  } catch (err) {
    console.error("Clear owner sheets error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
