// Check workspace and contacts count
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  // Get all workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, slug, name')
  
  console.log('Workspaces:')
  for (const ws of workspaces || []) {
    const { count } = await supabase
      .from('owner_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', ws.id)
    
    console.log(`  ${ws.slug} (${ws.id}): ${count || 0} contacts`)
  }
}

check().catch(console.error)
