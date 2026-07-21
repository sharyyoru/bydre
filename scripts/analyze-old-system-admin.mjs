import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Use anon key for old system (it's what we have)
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

async function analyzeOldSystem() {
  console.log('🔍 Analyzing old bydre system (with admin access)...\n');

  try {
    // Try querying items directly with no filters
    console.log('Fetching items...');
    const { data: items, error: itemsError, count: itemsCount } = await oldSupabase
      .from('items')
      .select('*', { count: 'exact' });

    if (itemsError) {
      console.error('❌ Error fetching items:', itemsError.message);
      console.error('Details:', itemsError);
    } else {
      console.log(`✅ Items found: ${itemsCount || items?.length || 0}`);
      if (items && items.length > 0) {
        console.log('\nSample items:');
        items.slice(0, 3).forEach(item => {
          console.log(`   - ${item.title} (ID: ${item.id})`);
        });
      }
    }

    // Try querying boards
    console.log('\nFetching boards...');
    const { data: boards, error: boardsError, count: boardsCount } = await oldSupabase
      .from('boards')
      .select('*', { count: 'exact' });

    if (boardsError) {
      console.error('❌ Error fetching boards:', boardsError.message);
    } else {
      console.log(`✅ Boards found: ${boardsCount || boards?.length || 0}`);
      if (boards && boards.length > 0) {
        console.log('\nBoards:');
        boards.forEach(board => {
          console.log(`   - ${board.name} (type: ${board.type})`);
        });
      }
    }

    // Try querying profiles
    console.log('\nFetching profiles...');
    const { data: profiles, error: profilesError, count: profilesCount } = await oldSupabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`✅ Profiles found: ${profilesCount || profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('\nProfiles:');
        profiles.slice(0, 3).forEach(profile => {
          console.log(`   - ${profile.email} (${profile.role})`);
        });
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

analyzeOldSystem();
