/**
 * Import Owner Sheets from an extracted folder
 * Usage: node --env-file=.env.local scripts/import-owner-sheets-folder.mjs "<folder_path>" <workspace_id>
 * 
 * Extract your zip first, then run this on the extracted folder.
 */

import { createClient } from "@supabase/supabase-js"
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
const folderPath = process.argv[2]
const workspaceId = process.argv[3]

if (!folderPath || !workspaceId) {
  console.error('Usage: node --env-file=.env.local scripts/import-owner-sheets-folder.mjs "<folder_path>" <workspace_id>')
  console.error('Example: node --env-file=.env.local scripts/import-owner-sheets-folder.mjs "C:\\Users\\user\\Downloads\\01 Dubai" your-workspace-id')
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

// Convert Excel serial date to ISO string
function excelDateToISO(serial) {
  if (!serial) return null
  // Check if it's already a date string
  if (typeof serial === 'string' && serial.includes('-')) return serial
  // Excel serial dates are days since 1900-01-01 (with a bug for 1900 leap year)
  const num = Number(serial)
  if (isNaN(num) || num < 1) return null
  const utc_days = Math.floor(num - 25569)
  const date = new Date(utc_days * 86400 * 1000)
  return date.toISOString().split('T')[0]
}

// Extract value from row
function getValue(row, mapping, field) {
  const colName = mapping[field]
  if (!colName) return null
  const val = row[colName]
  if (val === undefined || val === null || val === "") return null
  return String(val).trim()
}

// Extract date value from row
function getDateValue(row, mapping, field) {
  const colName = mapping[field]
  if (!colName) return null
  const val = row[colName]
  if (val === undefined || val === null || val === "") return null
  return excelDateToISO(val)
}

// Recursively find all Excel files
function findExcelFiles(dir, baseDir = dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findExcelFiles(fullPath, baseDir))
    } else if (entry.name.match(/\.(xlsx|xls)$/i) && !entry.name.startsWith("~$")) {
      files.push({
        fullPath,
        relativePath: path.relative(baseDir, fullPath),
        fileName: entry.name,
        folderName: path.relative(baseDir, dir) || null,
      })
    }
  }
  
  return files
}

async function main() {
  console.log(`\n📂 Scanning folder: ${folderPath}`)
  
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`)
    process.exit(1)
  }

  // Find all Excel files
  const excelFiles = findExcelFiles(folderPath)
  console.log(`📊 Found ${excelFiles.length} Excel files`)

  if (excelFiles.length === 0) {
    console.error("No Excel files found in folder")
    process.exit(1)
  }

  // Create upload batch record
  const { data: batch, error: batchError } = await supabase
    .from("owner_sheets_uploads")
    .insert({
      workspace_id: workspaceId,
      filename: path.basename(folderPath),
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

  let totalContacts = 0
  let fileCount = 0
  let errorCount = 0
  const BATCH_SIZE = 500

  // Process each Excel file
  for (let i = 0; i < excelFiles.length; i++) {
    const { fullPath, fileName, folderName } = excelFiles[i]
    
    try {
      const data = fs.readFileSync(fullPath)
      const workbook = XLSX.read(data, { type: "buffer" })

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
          last_contact_date: getDateValue(row, mapping, "last_contact_date"),
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
          console.error(`   ❌ Insert error for ${fileName}:`, insertError.message)
          errorCount++
        }
      }

      totalContacts += contacts.length
      fileCount++

      // Progress update every 50 files
      if (fileCount % 50 === 0 || i === excelFiles.length - 1) {
        const pct = ((i + 1) / excelFiles.length * 100).toFixed(1)
        console.log(`   📈 Progress: ${pct}% (${fileCount} files, ${totalContacts} contacts)`)
      }
    } catch (err) {
      console.error(`   ❌ Error processing ${fileName}:`, err.message)
      errorCount++
    }
  }

  console.log(`\n✅ File processing complete!`)
  console.log(`   Files: ${fileCount}`)
  console.log(`   Contacts: ${totalContacts}`)
  console.log(`   Errors: ${errorCount}`)

  // Detect TRUE duplicates (same contact + same property/unit = redundant data)
  // Multi-unit owners (same phone, different units) are NOT duplicates
  console.log("\n🔍 Detecting true duplicates (same contact + same property)...")
  
  const { data: allContacts } = await supabase
    .from("owner_contacts")
    .select("id, phone_normalized, email_normalized, property, unit")
    .eq("upload_batch_id", batchId)

  let dupeCount = 0
  if (allContacts && allContacts.length > 0) {
    // Group by phone+property+unit OR email+property+unit
    const phonePropertyGroups = new Map()
    const emailPropertyGroups = new Map()
    
    for (const c of allContacts) {
      // Create composite keys: phone+property+unit and email+property+unit
      if (c.phone_normalized) {
        const phoneKey = `${c.phone_normalized}|${c.property || ''}|${c.unit || ''}`
        const ids = phonePropertyGroups.get(phoneKey) || []
        ids.push(c.id)
        phonePropertyGroups.set(phoneKey, ids)
      }
      if (c.email_normalized) {
        const emailKey = `${c.email_normalized}|${c.property || ''}|${c.unit || ''}`
        const ids = emailPropertyGroups.get(emailKey) || []
        ids.push(c.id)
        emailPropertyGroups.set(emailKey, ids)
      }
    }

    // Mark phone+property duplicates
    for (const ids of phonePropertyGroups.values()) {
      if (ids.length > 1) {
        const [primary, ...dupes] = ids
        for (const dupeId of dupes) {
          await supabase
            .from("owner_contacts")
            .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "phone+property" })
            .eq("id", dupeId)
          dupeCount++
        }
      }
    }

    // Mark email+property duplicates (only for non-phone-duplicates)
    for (const ids of emailPropertyGroups.values()) {
      if (ids.length > 1) {
        const [primary, ...dupes] = ids
        for (const dupeId of dupes) {
          // Check if already marked as duplicate
          const { data: existing } = await supabase
            .from("owner_contacts")
            .select("is_duplicate")
            .eq("id", dupeId)
            .single()
          
          if (!existing?.is_duplicate) {
            await supabase
              .from("owner_contacts")
              .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "email+property" })
              .eq("id", dupeId)
            dupeCount++
          }
        }
      }
    }
    
    console.log(`   Found ${dupeCount} true duplicates (same contact + same property)`)
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
