import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Clinic staff phone numbers (digits only)
const clinicPhones = [
  '41763781173', '41798956939', '41799312066', '41764101490', 
  '41762075932', '41793297740', '41797254861', '41786334613',
  '41786248157', '41782543105', '41762170995', '41782102290',
  '33635955446', '33638415361', '639672311716', '639774599118',
  '13107747785', '971585417606'
]

async function check() {
  const { data, count } = await supabase
    .from('ad_simulation_leads')
    .select('id, name, phone', { count: 'exact' })
  
  console.log(`Total leads: ${count}`)
  
  const found = (data || []).filter(l => {
    if (!l.phone) return false
    const phone = l.phone.replace(/[^0-9]/g, '')
    return clinicPhones.some(cp => phone.includes(cp))
  })
  
  console.log(`\nClinic staff still in DB: ${found.length}`)
  found.forEach(l => console.log(`  - ${l.name} | ${l.phone}`))
  
  if (found.length > 0) {
    console.log('\nDeleting...')
    const { error } = await supabase
      .from('ad_simulation_leads')
      .delete()
      .in('id', found.map(l => l.id))
    
    if (error) console.log('Error:', error)
    else console.log(`✅ Deleted ${found.length} clinic staff`)
  }
  
  const { count: finalCount } = await supabase
    .from('ad_simulation_leads')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 Final lead count: ${finalCount}`)
}

check()
