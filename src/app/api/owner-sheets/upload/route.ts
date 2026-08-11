import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import JSZip from "jszip"
import * as XLSX from "xlsx"

// Increase body size limit for large zip files
export const maxDuration = 300 // 5 minutes timeout
export const dynamic = "force-dynamic"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials")
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Normalize phone number for duplicate matching
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return phone.replace(/\D/g, "") || null
}

// Normalize email for duplicate matching
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  return email.toLowerCase().trim() || null
}

// Map Excel columns to our schema using simple heuristics
function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  const patterns: Record<string, string[]> = {
    name: ["name", "owner", "owner name", "full name", "contact", "contact name", "landlord"],
    phone: ["phone", "mobile", "tel", "telephone", "contact number", "phone number", "mobile number", "cell"],
    email: ["email", "e-mail", "mail", "email address"],
    property: ["property", "property name", "unit name", "villa", "apartment"],
    area: ["area", "location", "district", "community", "zone"],
    building: ["building", "tower", "block", "building name"],
    unit: ["unit", "unit no", "unit number", "flat", "apt"],
    owner_type: ["type", "owner type", "category", "ownership type"],
    nationality: ["nationality", "country", "nation", "citizen"],
    language: ["language", "lang", "preferred language"],
    notes: ["notes", "remarks", "comments", "additional info"],
    last_contact_date: ["last contact", "contact date", "last contacted", "date"],
  }

  headers.forEach((header, idx) => {
    const lower = (header || "").toLowerCase().trim()
    for (const [field, keywords] of Object.entries(patterns)) {
      if (keywords.some((k) => lower.includes(k) || lower === k)) {
        if (!mapping[field]) {
          mapping[field] = headers[idx]
        }
        break
      }
    }
  })

  return mapping
}

// Extract value from row using column mapping
function getValue(row: Record<string, unknown>, mapping: Record<string, string>, field: string): string | null {
  const colName = mapping[field]
  if (!colName) return null
  const val = row[colName]
  if (val === undefined || val === null || val === "") return null
  return String(val).trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const workspaceId = formData.get("workspaceId") as string | null

    if (!file || !workspaceId) {
      return NextResponse.json({ error: "File and workspaceId required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Create upload batch record
    const { data: batch, error: batchError } = await supabase
      .from("owner_sheets_uploads")
      .insert({
        workspace_id: workspaceId,
        filename: file.name,
        status: "processing",
      })
      .select("id")
      .single()

    if (batchError || !batch) {
      console.error("Failed to create batch:", batchError)
      return NextResponse.json({ error: "Failed to create upload batch" }, { status: 500 })
    }

    const batchId = batch.id

    // Read zip file
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const contacts: Array<{
      workspace_id: string
      upload_batch_id: string
      name: string | null
      phone: string | null
      phone_normalized: string | null
      email: string | null
      email_normalized: string | null
      property: string | null
      area: string | null
      building: string | null
      unit: string | null
      owner_type: string | null
      nationality: string | null
      language: string | null
      notes: string | null
      last_contact_date: string | null
      source_file: string
      source_folder: string | null
      source_row: number
      is_duplicate: boolean
      duplicate_of: string | null
      duplicate_reason: string | null
    }> = []

    let fileCount = 0

    // Process each file in the zip
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue
      if (!path.match(/\.(xlsx|xls)$/i)) continue

      try {
        const data = await zipEntry.async("arraybuffer")
        const workbook = XLSX.read(data, { type: "array" })

        // Get folder name from path
        const pathParts = path.split("/")
        const fileName = pathParts.pop() || path
        const folderName = pathParts.length > 0 ? pathParts.join("/") : null

        fileCount++

        // Process first sheet
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) continue

        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

        if (rows.length === 0) continue

        // Get headers from first row's keys
        const headers = Object.keys(rows[0] || {})
        const mapping = mapColumns(headers)

        // Process each row
        rows.forEach((row, idx) => {
          const name = getValue(row, mapping, "name")
          const phone = getValue(row, mapping, "phone")
          const email = getValue(row, mapping, "email")

          // Skip rows with no identifying information
          if (!name && !phone && !email) return

          contacts.push({
            workspace_id: workspaceId,
            upload_batch_id: batchId,
            name,
            phone,
            phone_normalized: normalizePhone(phone),
            email,
            email_normalized: normalizeEmail(email),
            property: getValue(row, mapping, "property"),
            area: getValue(row, mapping, "area"),
            building: getValue(row, mapping, "building"),
            unit: getValue(row, mapping, "unit"),
            owner_type: getValue(row, mapping, "owner_type"),
            nationality: getValue(row, mapping, "nationality"),
            language: getValue(row, mapping, "language"),
            notes: getValue(row, mapping, "notes"),
            last_contact_date: getValue(row, mapping, "last_contact_date"),
            source_file: fileName,
            source_folder: folderName,
            source_row: idx + 2, // +2 for header row and 1-indexed
            is_duplicate: false,
            duplicate_of: null,
            duplicate_reason: null,
          })
        })
      } catch (err) {
        console.error(`Error processing ${path}:`, err)
      }
    }

    // Insert contacts in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const chunk = contacts.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase.from("owner_contacts").insert(chunk)
      if (insertError) {
        console.error("Insert error:", insertError)
      }
    }

    // Detect duplicates by phone
    const { data: phoneDupes } = await supabase
      .from("owner_contacts")
      .select("id, phone_normalized")
      .eq("upload_batch_id", batchId)
      .not("phone_normalized", "is", null)

    if (phoneDupes && phoneDupes.length > 0) {
      const phoneGroups = new Map<string, string[]>()
      for (const c of phoneDupes) {
        if (!c.phone_normalized) continue
        const ids = phoneGroups.get(c.phone_normalized) || []
        ids.push(c.id)
        phoneGroups.set(c.phone_normalized, ids)
      }

      for (const ids of Array.from(phoneGroups.values())) {
        if (ids.length > 1) {
          const [primary, ...dupes] = ids
          for (const dupeId of dupes) {
            await supabase
              .from("owner_contacts")
              .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "phone" })
              .eq("id", dupeId)
          }
        }
      }
    }

    // Detect duplicates by email (only for non-phone-duplicates)
    const { data: emailDupes } = await supabase
      .from("owner_contacts")
      .select("id, email_normalized")
      .eq("upload_batch_id", batchId)
      .eq("is_duplicate", false)
      .not("email_normalized", "is", null)

    if (emailDupes && emailDupes.length > 0) {
      const emailGroups = new Map<string, string[]>()
      for (const c of emailDupes) {
        if (!c.email_normalized) continue
        const ids = emailGroups.get(c.email_normalized) || []
        ids.push(c.id)
        emailGroups.set(c.email_normalized, ids)
      }

      for (const ids of Array.from(emailGroups.values())) {
        if (ids.length > 1) {
          const [primary, ...dupes] = ids
          for (const dupeId of dupes) {
            await supabase
              .from("owner_contacts")
              .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "email" })
              .eq("id", dupeId)
          }
        }
      }
    }

    // Count duplicates
    const { count: duplicateCount } = await supabase
      .from("owner_contacts")
      .select("*", { count: "exact", head: true })
      .eq("upload_batch_id", batchId)
      .eq("is_duplicate", true)

    // Update batch status
    await supabase
      .from("owner_sheets_uploads")
      .update({
        status: "completed",
        file_count: fileCount,
        contact_count: contacts.length,
        duplicate_count: duplicateCount || 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchId)

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      file_count: fileCount,
      contact_count: contacts.length,
      duplicate_count: duplicateCount || 0,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
