/**
 * Import Premium Foreign Patients from Aesthetic Clinic
 * 
 * Reads xlsx file and imports leads into ad_simulation_leads table
 * with calculated wealth scores.
 * 
 * Usage:
 *   npx ts-node scripts/ad-simulation/import-clinic-leads.ts
 */

import { createClient } from '@supabase/supabase-js'
import xlsx from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { config } from 'dotenv'

const { readFile, utils } = xlsx

// Load environment variables
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Path to the clinic xlsx file
const CLINIC_DATA_PATH = 'C:/Users/user/aesthetic-clinic/premium_foreign_patients_2026-08-17T12-34-23.xlsx'

// Default workspace ID (you may need to update this)
const DEFAULT_WORKSPACE_ID = process.env.AD_SIM_WORKSPACE_ID || null

interface ClinicPatient {
  '#': number
  'Patient Name': string
  'Email': string
  'Phone': string
  'Country': string | null
  'Transaction Count': number
  'Total Amount (CHF)': number
}

interface LeadInsert {
  workspace_id: string | null
  source: string
  source_id: string
  name: string
  email: string | null
  phone: string | null
  country: string | null
  total_spend: number
  transaction_count: number
  status: string
  tags: string[]
}

function parseXlsx(filePath: string): ClinicPatient[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  
  const workbook = readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  const data = utils.sheet_to_json<ClinicPatient>(worksheet)
  
  console.log(`📊 Parsed ${data.length} patients from xlsx`)
  
  return data
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  
  // Remove spaces and normalize
  let normalized = phone.toString().replace(/\s+/g, '')
  
  // Ensure starts with +
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.slice(2)
    } else if (normalized.startsWith('0')) {
      normalized = '+41' + normalized.slice(1)
    }
  }
  
  return normalized
}

function transformToLead(patient: ClinicPatient, workspaceId: string | null): LeadInsert {
  return {
    workspace_id: workspaceId,
    source: 'aesthetic_clinic',
    source_id: `clinic_patient_${patient['#']}`,
    name: patient['Patient Name']?.trim() || 'Unknown',
    email: patient['Email']?.trim()?.toLowerCase() || null,
    phone: normalizePhone(patient['Phone']),
    country: patient['Country'] || null,
    total_spend: patient['Total Amount (CHF)'] || 0,
    transaction_count: patient['Transaction Count'] || 0,
    status: 'imported',
    tags: ['premium', 'foreign_patient', 'clinic_import'],
  }
}

async function getOrCreateWorkspace(): Promise<string | null> {
  if (DEFAULT_WORKSPACE_ID) {
    return DEFAULT_WORKSPACE_ID
  }
  
  // Try to find existing workspace
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)
  
  if (error) {
    console.warn('Could not fetch workspaces:', error.message)
    return null
  }
  
  if (workspaces && workspaces.length > 0) {
    console.log(`📁 Using workspace: ${workspaces[0].name}`)
    return workspaces[0].id
  }
  
  return null
}

async function importLeads(leads: LeadInsert[]): Promise<void> {
  console.log(`\n📥 Importing ${leads.length} leads to Supabase...`)
  
  // Check for existing leads to avoid duplicates
  const sourceIds = leads.map(l => l.source_id)
  
  const { data: existing } = await supabase
    .from('ad_simulation_leads')
    .select('source_id')
    .in('source_id', sourceIds)
  
  const existingIds = new Set(existing?.map(e => e.source_id) || [])
  const newLeads = leads.filter(l => !existingIds.has(l.source_id))
  
  if (existingIds.size > 0) {
    console.log(`⏭️  Skipping ${existingIds.size} already imported leads`)
  }
  
  if (newLeads.length === 0) {
    console.log('✅ All leads already imported!')
    return
  }
  
  // Insert in batches
  const BATCH_SIZE = 50
  let imported = 0
  
  for (let i = 0; i < newLeads.length; i += BATCH_SIZE) {
    const batch = newLeads.slice(i, i + BATCH_SIZE)
    
    const { error } = await supabase
      .from('ad_simulation_leads')
      .insert(batch)
    
    if (error) {
      console.error(`❌ Error importing batch ${i / BATCH_SIZE + 1}:`, error.message)
      continue
    }
    
    imported += batch.length
    console.log(`  ✓ Imported batch ${Math.floor(i / BATCH_SIZE) + 1} (${imported}/${newLeads.length})`)
  }
  
  console.log(`\n✅ Successfully imported ${imported} leads!`)
}

async function printSummary(): Promise<void> {
  const { data: stats } = await supabase
    .from('ad_simulation_leads')
    .select('status, wealth_score, re_potential_score, total_spend')
  
  if (!stats || stats.length === 0) {
    console.log('\n📊 No leads in database yet')
    return
  }
  
  const totalSpend = stats.reduce((sum, l) => sum + (l.total_spend || 0), 0)
  const avgWealth = stats.reduce((sum, l) => sum + (l.wealth_score || 0), 0) / stats.length
  const avgPotential = stats.reduce((sum, l) => sum + (l.re_potential_score || 0), 0) / stats.length
  const highPotential = stats.filter(l => (l.re_potential_score || 0) >= 70).length
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 LEAD IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total Leads:         ${stats.length}`)
  console.log(`Total Spend:         CHF ${totalSpend.toLocaleString()}`)
  console.log(`Avg Wealth Score:    ${avgWealth.toFixed(1)}/100`)
  console.log(`Avg RE Potential:    ${avgPotential.toFixed(1)}/100`)
  console.log(`High Potential (70+): ${highPotential} leads`)
  console.log('='.repeat(50))
}

async function main() {
  console.log('🚀 Starting Clinic Lead Import')
  console.log('='.repeat(50))
  
  try {
    // Get workspace
    const workspaceId = await getOrCreateWorkspace()
    
    // Parse xlsx
    const patients = parseXlsx(CLINIC_DATA_PATH)
    
    // Transform to leads
    const leads = patients.map(p => transformToLead(p, workspaceId))
    
    // Show preview
    console.log('\n📋 Sample leads:')
    leads.slice(0, 3).forEach(l => {
      console.log(`  - ${l.name}: CHF ${l.total_spend.toLocaleString()} (${l.transaction_count} txns)`)
    })
    
    // Import
    await importLeads(leads)
    
    // Print summary
    await printSummary()
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

main()
