/**
 * Cleanup test data and clinic staff from Ad Simulation leads
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Clinic staff phone numbers to exclude
const CLINIC_STAFF_PHONES = [
  '+41763781173',
  '+971585417606',
  '+33635955446',
  '+41798956939',
  '+639672311716',
  '+41799312066',
  '+41764101490',
  '+41762075932',
  '+41793297740',
  '+41797254861',
  '+639774599118',
  '+33638415361',
  '+41786334613',
  '+41786248157',
  '+41782543105',
  '+41762170995',
  '+13107747785',
  '+41782102290'
]

function normalizePhone(phone: string): string {
  return (phone || '').replace(/[\s\-\(\)]/g, '')
}

async function cleanup() {
  console.log('🧹 Cleaning up test data and clinic staff...\n')
  
  // Get all leads first
  const { data: leads, error } = await supabase
    .from('ad_simulation_leads')
    .select('id, name, email, phone')
  
  if (error) {
    console.error('Error fetching leads:', error)
    return
  }
  
  console.log(`Total leads before cleanup: ${leads?.length || 0}`)
  
  const normalizedClinicPhones = CLINIC_STAFF_PHONES.map(normalizePhone)
  
  const toDelete = (leads || []).filter(l => {
    const name = (l.name || '').toLowerCase()
    const email = (l.email || '').toLowerCase()
    const phone = normalizePhone(l.phone || '')
    
    // Check test data conditions
    const isWilsonMutant = name.includes('wilson mutant')
    const isRalfNew = name.includes('ralf new')
    const isMacariolou = email.includes('macariolou')
    const hasMutantEmail = email.includes('mutant')
    const isPhilippineNumber = phone.startsWith('+63')
    const isDubaiNumber = phone.startsWith('+971')
    
    // Check if clinic staff
    const isClinicStaff = normalizedClinicPhones.some(cp => phone.includes(cp) || cp.includes(phone))
    
    return isWilsonMutant || isRalfNew || isMacariolou || hasMutantEmail || isPhilippineNumber || isDubaiNumber || isClinicStaff
  })
  
  console.log(`\nFound ${toDelete.length} test records to delete:\n`)
  toDelete.forEach(l => {
    console.log(`  ❌ ${l.name} | ${l.email || 'no email'} | ${l.phone || 'no phone'}`)
  })
  
  if (toDelete.length > 0) {
    const ids = toDelete.map(l => l.id)
    const { error: deleteError } = await supabase
      .from('ad_simulation_leads')
      .delete()
      .in('id', ids)
    
    if (deleteError) {
      console.log('\n❌ Error:', deleteError.message)
    } else {
      console.log(`\n✅ Deleted ${toDelete.length} test records`)
    }
  } else {
    console.log('\n✅ No test records found')
  }
  
  // Final count
  const { count } = await supabase
    .from('ad_simulation_leads')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 Remaining leads: ${count}`)
}

cleanup().catch(console.error)
