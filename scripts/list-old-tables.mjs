import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

async function listTables() {
  console.log('📋 Listing all tables in old system...\n');

  try {
    // Query information_schema to list all tables
    const { data, error } = await oldSupabase
      .rpc('get_tables', {});

    if (error) {
      console.log('RPC not available, trying direct query...');
      
      // Try querying items directly
      const { data: items, error: itemsError } = await oldSupabase
        .from('items')
        .select('*')
        .limit(1);
      
      if (itemsError) {
        console.error('❌ Error querying items:', itemsError.message);
      } else {
        console.log('✅ items table exists');
        console.log('Sample record:', items?.[0]);
      }
    } else {
      console.log('Tables:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listTables();
