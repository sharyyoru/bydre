import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
}

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates...\n')
  
  // Get all leads (bypass 1000 row limit)
  let allLeads: Lead[] = []
  let offset = 0
  const batchSize = 1000
  
  while (true) {
    const { data } = await supabase
      .from('ad_simulation_leads')
      .select('id, name, email, phone')
      .range(offset, offset + batchSize - 1)
    
    if (!data || data.length === 0) break
    allLeads = allLeads.concat(data)
    if (data.length < batchSize) break
    offset += batchSize
  }
  
  const leads = allLeads
  
  console.log(`Total leads: ${leads?.length}\n`)
  
  // Check email duplicates
  const emails = new Map<string, Lead>()
  const emailDupes: { email: string; leads: Lead[] }[] = []
  
  // Check phone duplicates  
  const phones = new Map<string, Lead>()
  const phoneDupes: { phone: string; leads: Lead[] }[] = []
  
  // Check name duplicates
  const names = new Map<string, Lead>()
  const nameDupes: { name: string; leads: Lead[] }[] = []
  
  for (const lead of leads || []) {
    // Email check
    if (lead.email) {
      const email = lead.email.toLowerCase().trim()
      if (emails.has(email)) {
        emailDupes.push({ email, leads: [emails.get(email)!, lead] })
      } else {
        emails.set(email, lead)
      }
    }
    
    // Phone check
    if (lead.phone) {
      const phone = lead.phone.replace(/[^0-9+]/g, '')
      if (phones.has(phone)) {
        phoneDupes.push({ phone, leads: [phones.get(phone)!, lead] })
      } else {
        phones.set(phone, lead)
      }
    }
    
    // Name check (exact match)
    const name = lead.name.toLowerCase().trim()
    if (names.has(name)) {
      nameDupes.push({ name, leads: [names.get(name)!, lead] })
    } else {
      names.set(name, lead)
    }
  }
  
  console.log('=' .repeat(50))
  console.log('📧 EMAIL DUPLICATES:', emailDupes.length)
  console.log('=' .repeat(50))
  if (emailDupes.length > 0) {
    emailDupes.forEach(d => {
      console.log(`\n  Email: ${d.email}`)
      d.leads.forEach(l => console.log(`    - ${l.name} (ID: ${l.id})`))
    })
  } else {
    console.log('  ✅ No email duplicates found')
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📱 PHONE DUPLICATES:', phoneDupes.length)
  console.log('=' .repeat(50))
  if (phoneDupes.length > 0) {
    phoneDupes.forEach(d => {
      console.log(`\n  Phone: ${d.phone}`)
      d.leads.forEach(l => console.log(`    - ${l.name} (ID: ${l.id})`))
    })
  } else {
    console.log('  ✅ No phone duplicates found')
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('👤 NAME DUPLICATES:', nameDupes.length)
  console.log('=' .repeat(50))
  if (nameDupes.length > 0) {
    nameDupes.slice(0, 10).forEach(d => {
      console.log(`\n  Name: ${d.name}`)
      d.leads.forEach(l => console.log(`    - Email: ${l.email || 'none'} | Phone: ${l.phone || 'none'} (ID: ${l.id})`))
    })
    if (nameDupes.length > 10) {
      console.log(`\n  ... and ${nameDupes.length - 10} more name duplicates`)
    }
  } else {
    console.log('  ✅ No name duplicates found')
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('SUMMARY')
  console.log('=' .repeat(50))
  console.log(`  Total leads: ${leads?.length}`)
  console.log(`  Email duplicates: ${emailDupes.length}`)
  console.log(`  Phone duplicates: ${phoneDupes.length}`)
  console.log(`  Name duplicates: ${nameDupes.length}`)
}

checkDuplicates()
