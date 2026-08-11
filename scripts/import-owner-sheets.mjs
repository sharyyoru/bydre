/**
 * Import Owner Sheets from local zip file
 * Usage: node --env-file=.env.local scripts/import-owner-sheets.mjs "C:\Users\user\Downloads\01 Dubai.zip" <workspace_id>
 */

import { createClient } from "@supabase/supabase-js"
import JSZip from "jszip"
import * as XLSX from "xlsx"
import fs from "fs"
import path from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Get args
const zipPath = process.argv[2]
const workspaceId = process.argv[3]

if (!zipPath || !workspaceId) {
  console.error('Usage: node --env-file=.env.local scripts/import-owner-sheets.mjs "<zip_path>" <workspace_id>')
  console.error('Example: node --env-file=.env.local scripts/import-owner-sheets.mjs "C:\\Users\\user\\Downloads\\01 Dubai.zip" your-workspace-id')
  process.exit(1)
}

// Normalize phone number
function normalizePhone(phone) {
  if (!phone) return null
  return phone.toString().replace(/\D/g, "") || null
}

// Normalize email
function normalizeEmail(email) {
  if (!email) return null
  return email.toString().toLowerCase().trim() || null
}

// Map Excel columns to schema
function mapColumns(headers) {
  const mapping = {}
  const patterns = {
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
    const lower = (header || "").toString().toLowerCase().trim()
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

// Extract value from row
function getValue(row, mapping, field) {
  const colName = mapping[field]
  if (!colName) return null
  const val = row[colName]
  if (val === undefined || val === null || val === "") return null
  return String(val).trim()
}

async function main() {
  console.log(`\n📂 Reading zip file: ${zipPath}`)
  
  if (!fs.existsSync(zipPath)) {
    console.error(`File not found: ${zipPath}`)
    process.exit(1)
  }

  const stats = fs.statSync(zipPath)
  console.log(`📦 Zip size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`)

  // Create upload batch record
  const filename = path.basename(zipPath)
  const { data: batch, error: batchError } = await supabase
    .from("owner_sheets_uploads")
    .insert({
      workspace_id: workspaceId,
      filename: filename,
      status: "processing",
    })
    .select("id")
    .single()

  if (batchError || !batch) {
    console.error("Failed to create batch:", batchError)
    process.exit(1)
  }

  const batchId = batch.id
  console.log(`📝 Created batch: ${batchId}`)

  // Stream the zip file for large files
  console.log(`� Loading zip (streaming for large files)...`)
  const zip = await JSZip.loadAsync(fs.createReadStream(zipPath))
  
  // Get list of Excel files
  const excelFiles = Object.keys(zip.files).filter(
    (name) => !zip.files[name].dir && name.match(/\.(xlsx|xls)$/i)
  )
  
  console.log(`📊 Found ${excelFiles.length} Excel files`)

  let totalContacts = 0
  let fileCount = 0
  const BATCH_SIZE = 500

  // Process files in batches to manage memory
  for (let i = 0; i < excelFiles.length; i++) {
    const filePath = excelFiles[i]
    
    try {
      const zipEntry = zip.files[filePath]
      const data = await zipEntry.async("arraybuffer")
      const workbook = XLSX.read(data, { type: "array" })

      const pathParts = filePath.split("/")
      const fileName = pathParts.pop() || filePath
      const folderName = pathParts.length > 0 ? pathParts.join("/") : null

      const sheetName = workbook.SheetNames[0]
      if (!sheetName) continue

      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

      if (rows.length === 0) continue

      const headers = Object.keys(rows[0] || {})
      const mapping = mapColumns(headers)

      const contacts = []

      rows.forEach((row, idx) => {
        const name = getValue(row, mapping, "name")
        const phone = getValue(row, mapping, "phone")
        const email = getValue(row, mapping, "email")

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
          source_row: idx + 2,
          is_duplicate: false,
          duplicate_of: null,
          duplicate_reason: null,
        })
      })

      // Insert contacts in batches
      for (let j = 0; j < contacts.length; j += BATCH_SIZE) {
        const chunk = contacts.slice(j, j + BATCH_SIZE)
        const { error: insertError } = await supabase.from("owner_contacts").insert(chunk)
        if (insertError) {
          console.error(`Insert error for ${fileName}:`, insertError.message)
        }
      }

      totalContacts += contacts.length
      fileCount++

      if (fileCount % 50 === 0) {
        console.log(`   Processed ${fileCount}/${excelFiles.length} files (${totalContacts} contacts)`)
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message)
    }
  }

  console.log(`\n✅ Processed ${fileCount} files, ${totalContacts} contacts`)

  // Detect duplicates by phone
  console.log("\n🔍 Detecting phone duplicates...")
  const { data: phoneDupes } = await supabase
    .from("owner_contacts")
    .select("id, phone_normalized")
    .eq("upload_batch_id", batchId)
    .not("phone_normalized", "is", null)

  if (phoneDupes && phoneDupes.length > 0) {
    const phoneGroups = new Map()
    for (const c of phoneDupes) {
      if (!c.phone_normalized) continue
      const ids = phoneGroups.get(c.phone_normalized) || []
      ids.push(c.id)
      phoneGroups.set(c.phone_normalized, ids)
    }

    let phoneDupeCount = 0
    for (const ids of phoneGroups.values()) {
      if (ids.length > 1) {
        const [primary, ...dupes] = ids
        for (const dupeId of dupes) {
          await supabase
            .from("owner_contacts")
            .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "phone" })
            .eq("id", dupeId)
          phoneDupeCount++
        }
      }
    }
    console.log(`   Found ${phoneDupeCount} phone duplicates`)
  }

  // Detect duplicates by email
  console.log("🔍 Detecting email duplicates...")
  const { data: emailDupes } = await supabase
    .from("owner_contacts")
    .select("id, email_normalized")
    .eq("upload_batch_id", batchId)
    .eq("is_duplicate", false)
    .not("email_normalized", "is", null)

  if (emailDupes && emailDupes.length > 0) {
    const emailGroups = new Map()
    for (const c of emailDupes) {
      if (!c.email_normalized) continue
      const ids = emailGroups.get(c.email_normalized) || []
      ids.push(c.id)
      emailGroups.set(c.email_normalized, ids)
    }

    let emailDupeCount = 0
    for (const ids of emailGroups.values()) {
      if (ids.length > 1) {
        const [primary, ...dupes] = ids
        for (const dupeId of dupes) {
          await supabase
            .from("owner_contacts")
            .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "email" })
            .eq("id", dupeId)
          emailDupeCount++
        }
      }
    }
    console.log(`   Found ${emailDupeCount} email duplicates`)
  }

  // Count total duplicates
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
      contact_count: totalContacts,
      duplicate_count: duplicateCount || 0,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId)

  console.log(`\n🎉 Import complete!`)
  console.log(`   Files: ${fileCount}`)
  console.log(`   Contacts: ${totalContacts}`)
  console.log(`   Duplicates: ${duplicateCount || 0}`)
  console.log(`   Batch ID: ${batchId}`)
}

main().catch(console.error)
