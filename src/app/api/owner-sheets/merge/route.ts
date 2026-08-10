import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { primaryId, duplicateIds, workspaceId } = await request.json()

    if (!primaryId || !duplicateIds || !workspaceId) {
      return NextResponse.json(
        { error: "primaryId, duplicateIds, and workspaceId required" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Verify primary exists
    const { data: primary, error: primaryError } = await supabase
      .from("owner_contacts")
      .select("id")
      .eq("id", primaryId)
      .eq("workspace_id", workspaceId)
      .single()

    if (primaryError || !primary) {
      return NextResponse.json({ error: "Primary contact not found" }, { status: 404 })
    }

    // Mark primary as not a duplicate
    await supabase
      .from("owner_contacts")
      .update({ is_duplicate: false, duplicate_of: null, duplicate_reason: null })
      .eq("id", primaryId)

    // Delete the duplicate records
    if (duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("owner_contacts")
        .delete()
        .in("id", duplicateIds)
        .eq("workspace_id", workspaceId)

      if (deleteError) {
        console.error("Delete error:", deleteError)
        return NextResponse.json({ error: "Failed to delete duplicates" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, merged: duplicateIds.length })
  } catch (error) {
    console.error("Merge error:", error)
    return NextResponse.json({ error: "Merge failed" }, { status: 500 })
  }
}
