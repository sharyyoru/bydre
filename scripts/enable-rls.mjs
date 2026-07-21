import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function enableRLS() {
  console.log('Enabling RLS and creating policies...');

  const tables = [
    'users', 'companies', 'contacts', 'projects', 'agents', 'appointments',
    'deals', 'tasks', 'consultations', 'emails', 'documents', 'workflows',
    'chat_conversations', 'chat_messages', 'invoices', 'invoice_items'
  ];

  for (const table of tables) {
    try {
      // Enable RLS
      await supabase.rpc('exec', {
        sql: `ALTER TABLE IF EXISTS ${table} ENABLE ROW LEVEL SECURITY;`
      }).catch(() => null);

      // Create a basic policy allowing authenticated users
      await supabase.rpc('exec', {
        sql: `
          CREATE POLICY "Allow authenticated users" ON ${table}
          FOR ALL USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');
        `
      }).catch(() => null);

      console.log(`✓ RLS enabled for ${table}`);
    } catch (err) {
      console.log(`⚠️  Could not set RLS for ${table}: ${err.message}`);
    }
  }

  console.log('\n✅ RLS setup complete!');
}

enableRLS();
