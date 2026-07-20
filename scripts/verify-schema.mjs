import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifySchema() {
  console.log('Verifying Cream CRM schema...\n');

  const tables = [
    'users', 'companies', 'contacts', 'projects', 'agents',
    'appointments', 'deals', 'tasks', 'consultations',
    'emails', 'documents', 'workflows', 'chat_conversations',
    'chat_messages', 'invoices', 'invoice_items'
  ];

  let found = 0;
  let missing = 0;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table} - NOT FOUND`);
        missing++;
      } else {
        console.log(`✅ ${table} - EXISTS (${data?.length || 0} rows)`);
        found++;
      }
    } catch (err) {
      console.log(`❌ ${table} - ERROR: ${err.message}`);
      missing++;
    }
  }

  console.log(`\n📊 Schema Verification Summary:`);
  console.log(`   ✅ Found: ${found}/${tables.length} tables`);
  console.log(`   ❌ Missing: ${missing}/${tables.length} tables`);

  if (missing === 0) {
    console.log('\n🎉 All required tables exist!');
  } else {
    console.log('\n⚠️  Some tables are missing. Run the schema migration.');
  }
}

verifySchema().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
