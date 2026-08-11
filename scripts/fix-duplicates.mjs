/**
 * Fix duplicate detection for existing owner contacts
 * Resets all duplicates and re-detects using new logic:
 * - Only same phone/email AND same property+unit = true duplicate
 * - Multi-unit owners are NOT duplicates
 * 
 * Usage: node --env-file=.env.local scripts/fix-duplicates.mjs <workspace_id>
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const workspaceId = process.argv[2]

if (!workspaceId) {
  console.error('Usage: node --env-file=.env.local scripts/fix-duplicates.mjs <workspace_id>')
  process.exit(1)
}

async function main() {
  console.log(`\n📊 Fixing duplicate detection for workspace: ${workspaceId}`)
  
  // Step 1: Reset all duplicates (in batches to avoid timeout)
  console.log("\n1️⃣ Resetting all duplicate flags...")
  
  // Get all IDs that are currently marked as duplicates
  const { data: dupeIds } = await supabase
    .from("owner_contacts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("is_duplicate", true)
  
  if (dupeIds && dupeIds.length > 0) {
    const BATCH_SIZE = 500
    for (let i = 0; i < dupeIds.length; i += BATCH_SIZE) {
      const batch = dupeIds.slice(i, i + BATCH_SIZE).map(r => r.id)
      await supabase
        .from("owner_contacts")
        .update({ is_duplicate: false, duplicate_of: null, duplicate_reason: null })
        .in("id", batch)
      
      if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= dupeIds.length) {
        console.log(`   Reset ${Math.min(i + BATCH_SIZE, dupeIds.length)}/${dupeIds.length}`)
      }
    }
  }
  console.log("   ✅ All duplicates reset")

  // Step 2: Get all contacts
  console.log("\n2️⃣ Loading all contacts...")
  const { data: allContacts, error: fetchError } = await supabase
    .from("owner_contacts")
    .select("id, phone_normalized, email_normalized, property, unit")
    .eq("workspace_id", workspaceId)

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    process.exit(1)
  }

  console.log(`   Found ${allContacts?.length || 0} contacts`)

  if (!allContacts || allContacts.length === 0) {
    console.log("   No contacts to process")
    return
  }

  // Step 3: Detect TRUE duplicates (same contact + same property/unit)
  console.log("\n3️⃣ Detecting true duplicates...")
  
  const phonePropertyGroups = new Map()
  const emailPropertyGroups = new Map()
  
  for (const c of allContacts) {
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

  let dupeCount = 0
  const markedDupes = new Set()

  // Mark phone+property duplicates
  for (const ids of phonePropertyGroups.values()) {
    if (ids.length > 1) {
      const [primary, ...dupes] = ids
      for (const dupeId of dupes) {
        if (!markedDupes.has(dupeId)) {
          await supabase
            .from("owner_contacts")
            .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "phone+property" })
            .eq("id", dupeId)
          markedDupes.add(dupeId)
          dupeCount++
        }
      }
    }
  }

  // Mark email+property duplicates (only for non-phone-duplicates)
  for (const ids of emailPropertyGroups.values()) {
    if (ids.length > 1) {
      const [primary, ...dupes] = ids
      for (const dupeId of dupes) {
        if (!markedDupes.has(dupeId)) {
          await supabase
            .from("owner_contacts")
            .update({ is_duplicate: true, duplicate_of: primary, duplicate_reason: "email+property" })
            .eq("id", dupeId)
          markedDupes.add(dupeId)
          dupeCount++
        }
      }
    }
  }

  console.log(`   ✅ Marked ${dupeCount} true duplicates`)

  // Step 4: Update batch stats
  console.log("\n4️⃣ Updating batch statistics...")
  const { data: batches } = await supabase
    .from("owner_sheets_uploads")
    .select("id")
    .eq("workspace_id", workspaceId)

  for (const batch of batches || []) {
    const { count } = await supabase
      .from("owner_contacts")
      .select("*", { count: "exact", head: true })
      .eq("upload_batch_id", batch.id)
      .eq("is_duplicate", true)

    await supabase
      .from("owner_sheets_uploads")
      .update({ duplicate_count: count || 0 })
      .eq("id", batch.id)
  }

  console.log(`   ✅ Updated ${batches?.length || 0} batch records`)

  console.log("\n🎉 Done! Duplicate detection has been fixed.")
  console.log(`   Total true duplicates: ${dupeCount}`)
}

main().catch(console.error)
