import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function normalizeEmail(email: string | null): string {
  return (email || '').toLowerCase().trim()
}

function normalizePhone(phone: string | null): string {
  return (phone || '').replace(/[^0-9+]/g, '')
}

function normalizeName(name: string | null): string {
  return (name || '').toLowerCase().trim()
}

async function checkNewExcel() {
  // Find the latest re_qualified_leads file (CSV or XLSX)
  const downloadsDir = 'C:\\Users\\user\\Downloads'
  const targetFile = 're_qualified_leads_2026-08-24 (2).csv'
  
  if (!targetFile) {
    console.log('❌ No re_qualified_leads file found')
    return
  }
  
  const filePath = path.join(downloadsDir, targetFile)
  console.log(`📄 Checking: ${targetFile}\n`)
  
  // Read file (CSV or Excel)
  let rows: any[]
  if (targetFile.endsWith('.csv')) {
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    const lines = csvContent.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: any = {}
      headers.forEach((h, i) => obj[h] = values[i] || '')
      return obj
    })
  } else {
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet)
  }
  
  console.log(`Excel rows: ${rows.length}`)
  
  // Get all DB leads
  let dbLeads: any[] = []
  let offset = 0
  const batchSize = 1000
  
  while (true) {
    const { data } = await supabase
      .from('ad_simulation_leads')
      .select('id, name, email, phone')
      .range(offset, offset + batchSize - 1)
    
    if (!data || data.length === 0) break
    dbLeads = dbLeads.concat(data)
    if (data.length < batchSize) break
    offset += batchSize
  }
  
  console.log(`DB leads: ${dbLeads.length}\n`)
  
  // Build lookup sets from DB
  const dbEmails = new Set(dbLeads.map(l => normalizeEmail(l.email)).filter(e => e))
  const dbPhones = new Set(dbLeads.map(l => normalizePhone(l.phone)).filter(p => p))
  const dbNames = new Set(dbLeads.map(l => normalizeName(l.name)).filter(n => n))
  
  // Check each Excel row
  const duplicates: any[] = []
  const newRecords: any[] = []
  
  for (const row of rows) {
    const name = row['Name'] || row.name || ''
    const email = row['Email'] || row.email || ''
    const phone = row['Phone'] || row.phone || ''
    
    const normEmail = normalizeEmail(email)
    const normPhone = normalizePhone(phone)
    const normName = normalizeName(name)
    
    const isDupe = 
      (normEmail && dbEmails.has(normEmail)) ||
      (normPhone && dbPhones.has(normPhone)) ||
      (normName && dbNames.has(normName))
    
    if (isDupe) {
      duplicates.push({ name, email, phone })
    } else {
      newRecords.push({ name, email, phone })
    }
  }
  
  console.log('=' .repeat(50))
  console.log('📊 RESULTS')
  console.log('=' .repeat(50))
  console.log(`\n✅ NEW RECORDS (not in DB): ${newRecords.length}`)
  console.log('=' .repeat(50))
  newRecords.forEach((r, i) => console.log(`  ${i+1}. ${r.name} | ${r.email || 'no email'} | ${r.phone || 'no phone'}`))
  
  console.log(`\n⚠️  Duplicates (already in DB): ${duplicates.length}`)
}

checkNewExcel()
