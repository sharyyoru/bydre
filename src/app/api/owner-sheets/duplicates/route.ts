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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const contactId = searchParams.get("contactId")
    const workspaceId = searchParams.get("workspaceId")

    if (!contactId || !workspaceId) {
      return NextResponse.json({ error: "contactId and workspaceId required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Get the contact
    const { data: contact, error: contactError } = await supabase
      .from("owner_contacts")
      .select("*")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // Find all related duplicates
    let duplicates = [contact]

    // If this is a duplicate, get the primary
    if (contact.duplicate_of) {
      const { data: primary } = await supabase
        .from("owner_contacts")
        .select("*")
        .eq("id", contact.duplicate_of)
        .single()
      if (primary) {
        duplicates = [primary]
      }
    }

    // Get the primary ID
    const primaryId = contact.duplicate_of || contact.id

    // Get all duplicates of this primary
    const { data: dupes } = await supabase
      .from("owner_contacts")
      .select("*")
      .eq("duplicate_of", primaryId)
      .eq("workspace_id", workspaceId)

    if (dupes) {
      duplicates = [...duplicates, ...dupes]
    }

    // Remove duplicates from array
    const seen = new Set<string>()
    duplicates = duplicates.filter((d) => {
      if (seen.has(d.id)) return false
      seen.add(d.id)
      return true
    })

    return NextResponse.json({ duplicates })
  } catch (error) {
    console.error("Duplicates error:", error)
    return NextResponse.json({ error: "Failed to fetch duplicates" }, { status: 500 })
  }
}
