import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function removeDuplicates() {
  console.log('🧹 Removing duplicates and test data...\n')
  
  // Get all leads (bypass 1000 row limit)
  let allLeads: any[] = []
  let offset = 0
  const batchSize = 1000
  
  while (true) {
    const { data } = await supabase
      .from('ad_simulation_leads')
      .select('id, name, email, phone, total_spend')
      .range(offset, offset + batchSize - 1)
    
    if (!data || data.length === 0) break
    allLeads = allLeads.concat(data)
    if (data.length < batchSize) break
    offset += batchSize
  }
  
  const leads = allLeads
  
  console.log(`Total leads before: ${leads?.length}`)
  
  const toDelete: string[] = []
  
  // 1. Remove test/demo data
  for (const lead of leads || []) {
    const name = (lead.name || '').toLowerCase()
    const email = (lead.email || '').toLowerCase()
    
    // Test data patterns
    if (name === 'test test' || name.includes('test')) {
      toDelete.push(lead.id)
      console.log(`  ❌ Test name: ${lead.name}`)
      continue
    }
    
    if (email.includes('@demo.com') || email.includes('@xt.com') || email.includes('test') || email.includes('@mutant') || email.includes('@tast.com')) {
      toDelete.push(lead.id)
      console.log(`  ❌ Test email: ${lead.email}`)
      continue
    }
  }
  
  // 2. Remove phone duplicates (keep highest spender)
  const phones = new Map<string, { id: string; spend: number; name: string }>()
  
  for (const lead of leads || []) {
    if (!lead.phone || toDelete.includes(lead.id)) continue
    
    const phone = lead.phone.replace(/[^0-9+]/g, '')
    const existing = phones.get(phone)
    
    if (existing) {
      // Keep the one with higher spend
      if (lead.total_spend > existing.spend) {
        toDelete.push(existing.id)
        phones.set(phone, { id: lead.id, spend: lead.total_spend, name: lead.name })
        console.log(`  ❌ Phone dupe (lower spend): ${existing.name} | ${phone}`)
      } else {
        toDelete.push(lead.id)
        console.log(`  ❌ Phone dupe (lower spend): ${lead.name} | ${phone}`)
      }
    } else {
      phones.set(phone, { id: lead.id, spend: lead.total_spend, name: lead.name })
    }
  }
  
  // 3. Remove exact name duplicates (keep highest spender)
  const names = new Map<string, { id: string; spend: number; email: string }>()
  
  for (const lead of leads || []) {
    if (toDelete.includes(lead.id)) continue
    
    const name = lead.name.toLowerCase().trim()
    const existing = names.get(name)
    
    if (existing) {
      // Keep the one with higher spend
      if (lead.total_spend > existing.spend) {
        toDelete.push(existing.id)
        names.set(name, { id: lead.id, spend: lead.total_spend, email: lead.email })
        console.log(`  ❌ Name dupe (lower spend): ${name}`)
      } else {
        toDelete.push(lead.id)
        console.log(`  ❌ Name dupe (lower spend): ${name}`)
      }
    } else {
      names.set(name, { id: lead.id, spend: lead.total_spend, email: lead.email })
    }
  }
  
  console.log(`\nTotal to delete: ${toDelete.length}`)
  
  if (toDelete.length > 0) {
    // Delete in batches
    const batchSize = 100
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize)
      const { error } = await supabase
        .from('ad_simulation_leads')
        .delete()
        .in('id', batch)
      
      if (error) {
        console.log(`Error deleting batch ${i / batchSize + 1}:`, error.message)
      }
    }
    console.log(`\n✅ Deleted ${toDelete.length} records`)
  }
  
  // Final count
  const { count } = await supabase
    .from('ad_simulation_leads')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 Remaining leads: ${count}`)
}

removeDuplicates()
