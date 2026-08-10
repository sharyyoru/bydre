import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

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
    const workspaceId = searchParams.get("workspaceId")
    const area = searchParams.get("area")
    const building = searchParams.get("building")
    const ownerType = searchParams.get("owner_type")
    const nationality = searchParams.get("nationality")
    const duplicatesOnly = searchParams.get("duplicatesOnly") === "true"
    const search = searchParams.get("search")
    const ids = searchParams.get("ids")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Build query
    let query = supabase
      .from("owner_contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    // If specific IDs provided, use those
    if (ids) {
      const idList = ids.split(",").filter(Boolean)
      query = query.in("id", idList)
    } else {
      // Apply filters
      if (area) query = query.eq("area", area)
      if (building) query = query.eq("building", building)
      if (ownerType) query = query.eq("owner_type", ownerType)
      if (nationality) query = query.eq("nationality", nationality)
      if (duplicatesOnly) query = query.eq("is_duplicate", true)
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }
    }

    const { data: contacts, error } = await query

    if (error) {
      console.error("Query error:", error)
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
    }

    // Transform data for export
    const exportData = (contacts || []).map((c) => ({
      Name: c.name || "",
      Phone: c.phone || "",
      Email: c.email || "",
      Property: c.property || "",
      Area: c.area || "",
      Building: c.building || "",
      Unit: c.unit || "",
      "Owner Type": c.owner_type || "",
      Nationality: c.nationality || "",
      Language: c.language || "",
      Notes: c.notes || "",
      "Last Contact Date": c.last_contact_date || "",
      "Source File": c.source_file || "",
      "Source Folder": c.source_folder || "",
      "Is Duplicate": c.is_duplicate ? "Yes" : "No",
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    worksheet["!cols"] = [
      { wch: 25 }, // Name
      { wch: 15 }, // Phone
      { wch: 30 }, // Email
      { wch: 25 }, // Property
      { wch: 15 }, // Area
      { wch: 20 }, // Building
      { wch: 10 }, // Unit
      { wch: 12 }, // Owner Type
      { wch: 15 }, // Nationality
      { wch: 12 }, // Language
      { wch: 30 }, // Notes
      { wch: 15 }, // Last Contact Date
      { wch: 20 }, // Source File
      { wch: 20 }, // Source Folder
      { wch: 12 }, // Is Duplicate
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Owner Contacts")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="owner-contacts-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
