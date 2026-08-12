// Clear owner sheets data for a workspace
// Usage: node --env-file=.env.local scripts/clear-owner-sheets.mjs

import { createClient } from '@supabase/supabase-js'

const WORKSPACE_ID = '4019ba3d-5f69-4c4a-8632-2de0dcdf398e'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearOwnerSheets() {
  console.log('Starting to clear owner sheets for workspace:', WORKSPACE_ID)

  // Step 1: Clear duplicate_of references
  console.log('Step 1: Clearing duplicate_of references...')
  const { error: updateError } = await supabase
    .from('owner_contacts')
    .update({ duplicate_of: null })
    .eq('workspace_id', WORKSPACE_ID)
    .not('duplicate_of', 'is', null)

  if (updateError) {
    console.error('Error clearing duplicate_of:', updateError)
  } else {
    console.log('Cleared duplicate_of references')
  }

  // Step 2: Delete contacts in small batches using RPC
  console.log('Step 2: Deleting contacts in batches...')
  let totalDeleted = 0
  const batchSize = 500 // Smaller batches

  while (true) {
    // Use raw SQL for faster deletion
    const { data, error: deleteError } = await supabase.rpc('delete_owner_contacts_batch', {
      ws_id: WORKSPACE_ID,
      batch_limit: batchSize
    })

    if (deleteError) {
      // Fallback to regular delete
      const { data: batch } = await supabase
        .from('owner_contacts')
        .select('id')
        .eq('workspace_id', WORKSPACE_ID)
        .limit(batchSize)

      if (!batch || batch.length === 0) {
        console.log('No more contacts to delete')
        break
      }

      // Delete in parallel (10 at a time)
      const chunks = []
      for (let i = 0; i < batch.length; i += 50) {
        chunks.push(batch.slice(i, i + 50))
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(row => 
          supabase.from('owner_contacts').delete().eq('id', row.id)
        ))
        totalDeleted += chunk.length
        console.log(`Deleted ${totalDeleted} contacts...`)
      }
      continue
    }

    if (data === 0) {
      console.log('No more contacts to delete')
      break
    }

    totalDeleted += data
    console.log(`Deleted ${totalDeleted} contacts so far...`)
  }

  // Step 3: Delete upload batches
  console.log('Step 3: Deleting upload records...')
  const { error: uploadError } = await supabase
    .from('owner_sheets_uploads')
    .delete()
    .eq('workspace_id', WORKSPACE_ID)

  if (uploadError) {
    console.error('Error deleting uploads:', uploadError)
  } else {
    console.log('Deleted upload records')
  }

  console.log(`\n✅ Done! Cleared ${totalDeleted} contacts`)
}

clearOwnerSheets().catch(console.error)
