/**
 * Deduplicate Ad Simulation Leads
 * 
 * Compares Excel files from aesthetic-clinic folder with current DB leads,
 * finds duplicates by email/phone, and updates with latest data.
 * 
 * Usage:
 *   npx ts-node scripts/ad-simulation/dedupe-leads.ts
 */

import { createClient } from '@supabase/supabase-js'
import xlsx from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

const { readFile, utils } = xlsx

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const CLINIC_FOLDER = 'C:/Users/user/aesthetic-clinic'

interface ExcelPatient {
  // Various column name formats from different Excel exports
  '#'?: number
  'Patient Name'?: string
  'patient_name'?: string
  'name'?: string
  'Email'?: string
  'email'?: string
  'Phone'?: string
  'phone'?: string
  'mobile'?: string
  'Country'?: string
  'country'?: string
  'Total Spent (CHF)'?: number
  'Total Amount (CHF)'?: number
  'total_spend'?: number
  'total_revenue'?: number
  'Transaction Count'?: number
  'transaction_count'?: number
  'visit_count'?: number
}

interface LeadRecord {
  id: string
  name: string
  email: string | null
  phone: string | null
  total_spend: number
  transaction_count: number
  source: string
  source_id: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  return email.toLowerCase().trim()
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '').trim() || null
}

function normalizeName(name: string | null | undefined): string {
  if (!name) return ''
  return name.trim().toLowerCase()
}

async function main() {
  console.log('🔍 Lead Deduplication Tool')
  console.log('=' .repeat(60))

  // Step 1: Find all Excel files in aesthetic-clinic folder
  const xlsxFiles = fs.readdirSync(CLINIC_FOLDER)
    .filter(f => f.endsWith('.xlsx'))
    .map(f => ({
      name: f,
      path: path.join(CLINIC_FOLDER, f),
      mtime: fs.statSync(path.join(CLINIC_FOLDER, f)).mtime
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()) // Latest first

  console.log(`\n📁 Found ${xlsxFiles.length} Excel files:`)
  xlsxFiles.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name} (${f.mtime.toISOString().split('T')[0]})`)
  })

  // Step 2: Load all patients from all Excel files
  const allPatients: Map<string, { patient: ExcelPatient; source: string; date: Date }> = new Map()
  
  for (const file of xlsxFiles) {
    try {
      const workbook = readFile(file.path)
      const sheetName = workbook.SheetNames[0]
      const data = utils.sheet_to_json<ExcelPatient>(workbook.Sheets[sheetName])
      
      console.log(`\n📊 ${file.name}: ${data.length} records`)
      
      for (const row of data) {
        // Handle various column name formats
        const name = row['Patient Name'] || row.patient_name || row.name || ''
        const email = normalizeEmail(row['Email'] || row.email)
        const phone = normalizePhone(row['Phone'] || row.phone || row.mobile)
        
        if (!name) continue
        
        // Create a unique key based on email OR phone OR name
        const key = email || phone || normalizeName(name)
        
        // Keep only the latest record for each unique person
        const existing = allPatients.get(key)
        if (!existing || file.mtime > existing.date) {
          allPatients.set(key, {
            patient: row,
            source: file.name,
            date: file.mtime
          })
        }
      }
    } catch (err) {
      console.log(`  ⚠️ Could not read ${file.name}`)
    }
  }

  console.log(`\n📋 Total unique patients across all files: ${allPatients.size}`)

  // Step 3: Get current leads from database
  const { data: currentLeads, error } = await supabase
    .from('ad_simulation_leads')
    .select('id, name, email, phone, total_spend, transaction_count, source, source_id')
  
  if (error) {
    console.error('❌ Error fetching leads:', error)
    process.exit(1)
  }

  console.log(`\n🗄️ Current leads in database: ${currentLeads?.length || 0}`)

  // Step 4: Find duplicates
  const duplicates: { dbLead: LeadRecord; excelPatient: ExcelPatient; source: string }[] = []
  const newPatients: { patient: ExcelPatient; source: string }[] = []
  
  for (const [key, { patient, source }] of Array.from(allPatients.entries())) {
    const email = normalizeEmail(patient['Email'] || patient.email)
    const phone = normalizePhone(patient['Phone'] || patient.phone || patient.mobile)
    const name = normalizeName(patient['Patient Name'] || patient.patient_name || patient.name)
    
    // Check if this patient exists in DB
    const existingLead = currentLeads?.find(lead => {
      const leadEmail = normalizeEmail(lead.email)
      const leadPhone = normalizePhone(lead.phone)
      const leadName = normalizeName(lead.name)
      
      // Match by email, phone, or exact name
      return (email && leadEmail && email === leadEmail) ||
             (phone && leadPhone && phone === leadPhone) ||
             (name && leadName && name === leadName)
    })
    
    if (existingLead) {
      duplicates.push({ dbLead: existingLead, excelPatient: patient, source })
    } else {
      newPatients.push({ patient, source })
    }
  }

  console.log(`\n🔄 Duplicates found: ${duplicates.length}`)
  console.log(`✨ New patients (not in DB): ${newPatients.length}`)

  // Step 5: Show duplicates
  if (duplicates.length > 0) {
    console.log('\n📋 Duplicate Details:')
    console.log('-'.repeat(60))
    
    for (const dup of duplicates.slice(0, 10)) { // Show first 10
      const excelSpend = dup.excelPatient['Total Spent (CHF)'] || dup.excelPatient['Total Amount (CHF)'] || dup.excelPatient.total_spend || 0
      const dbSpend = dup.dbLead.total_spend
      
      console.log(`  • ${dup.dbLead.name}`)
      console.log(`    DB: CHF ${dbSpend.toLocaleString()} | Excel: CHF ${excelSpend.toLocaleString()}`)
      console.log(`    Source: ${dup.source}`)
      if (excelSpend > dbSpend) {
        console.log(`    ⬆️ Excel has HIGHER spend - should update`)
      }
    }
    
    if (duplicates.length > 10) {
      console.log(`  ... and ${duplicates.length - 10} more`)
    }
  }

  // Step 6: Update duplicates with latest data
  console.log('\n🔄 Updating duplicates with latest data...')
  
  let updated = 0
  let skipped = 0
  
  for (const dup of duplicates) {
    const excelSpend = dup.excelPatient['Total Spent (CHF)'] || dup.excelPatient['Total Amount (CHF)'] || dup.excelPatient.total_spend || 0
    const excelTxns = dup.excelPatient['Transaction Count'] || dup.excelPatient.transaction_count || 0
    
    // Only update if Excel has more data
    if (excelSpend > dup.dbLead.total_spend || excelTxns > dup.dbLead.transaction_count) {
      const { error: updateError } = await supabase
        .from('ad_simulation_leads')
        .update({
          total_spend: Math.max(excelSpend, dup.dbLead.total_spend),
          transaction_count: Math.max(excelTxns, dup.dbLead.transaction_count),
          updated_at: new Date().toISOString()
        })
        .eq('id', dup.dbLead.id)
      
      if (!updateError) {
        updated++
      }
    } else {
      skipped++
    }
  }

  console.log(`  ✅ Updated: ${updated}`)
  console.log(`  ⏭️ Skipped (DB had better data): ${skipped}`)

  // Step 7: Add new patients
  if (newPatients.length > 0) {
    console.log(`\n➕ Adding ${newPatients.length} new patients...`)
    
    // Get workspace ID
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single()
    
    if (!workspace) {
      console.error('❌ No workspace found')
      process.exit(1)
    }

    const newLeads = newPatients.map(({ patient, source }) => ({
      workspace_id: workspace.id,
      source: 'aesthetic_clinic',
      source_id: source,
      name: (patient['Patient Name'] || patient.patient_name || patient.name || 'Unknown').trim(),
      email: normalizeEmail(patient['Email'] || patient.email),
      phone: normalizePhone(patient['Phone'] || patient.phone || patient.mobile),
      total_spend: patient['Total Spent (CHF)'] || patient['Total Amount (CHF)'] || patient.total_spend || 0,
      transaction_count: patient['Transaction Count'] || patient.transaction_count || 0,
      country: patient['Country'] || patient.country || null,
      status: 'imported',
      wealth_score: 0,
      re_potential_score: 0,
      tags: ['from_excel', 'dedupe_import']
    }))

    const { error: insertError, data: inserted } = await supabase
      .from('ad_simulation_leads')
      .insert(newLeads)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting new leads:', insertError)
    } else {
      console.log(`  ✅ Added ${inserted?.length || 0} new leads`)
    }
  }

  // Step 8: Final summary
  const { data: finalLeads } = await supabase
    .from('ad_simulation_leads')
    .select('id')
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 DEDUPLICATION COMPLETE')
  console.log('='.repeat(60))
  console.log(`  Total leads now: ${finalLeads?.length || 0}`)
  console.log(`  Duplicates merged: ${updated}`)
  console.log(`  New leads added: ${newPatients.length}`)
}

main().catch(console.error)
