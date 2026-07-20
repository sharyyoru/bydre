import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY;
const NEW_SUPABASE_URL = process.env.SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY || !NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function migrateCompanies() {
  console.log('Starting company migration...');

  // Get all companies from old system
  const { data: oldCompanies, error: fetchError } = await oldSupabase
    .from('companies')
    .select('*');

  if (fetchError) {
    console.error('Error fetching old companies:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${oldCompanies.length} companies to migrate`);

  let migrated = 0;
  let failed = 0;
  const companyMap = {}; // Map old IDs to new IDs

  for (const company of oldCompanies) {
    try {
      const { data: newCompany, error: insertError } = await newSupabase
        .from('companies')
        .insert({
          name: company.name,
          legal_name: company.legal_name,
          website: company.website,
          email: company.email,
          phone: company.phone,
          industry: company.industry,
          size: company.size,
          street_address: company.street_address,
          postal_code: company.postal_code,
          town: company.town,
          country: company.country,
          notes: company.notes,
          created_at: company.created_at,
          updated_at: company.updated_at,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to migrate company ${company.name}:`, insertError.message);
        failed++;
        continue;
      }

      companyMap[company.id] = newCompany.id;
      console.log(`✓ Migrated company: ${company.name}`);
      migrated++;
    } catch (err) {
      console.error(`Error migrating company ${company.name}:`, err.message);
      failed++;
    }
  }

  console.log(`\nCompany migration complete: ${migrated} succeeded, ${failed} failed`);
  console.log('Company ID mapping saved for reference');
  
  return companyMap;
}

migrateCompanies().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
