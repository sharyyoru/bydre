import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

async function analyzeOldSystem() {
  console.log('🔍 Analyzing old bydre system...\n');

  try {
    // Count users - try profiles first, then users
    let users = [];
    let usersError = null;
    
    const { data: profilesData, error: profilesError } = await oldSupabase
      .from('profiles')
      .select('id, email, full_name, role', { count: 'exact' });
    
    if (profilesError) {
      console.log('⚠️  profiles table not found, trying users table...');
      const { data: usersData, error: usersErr } = await oldSupabase
        .from('users')
        .select('id, email, full_name, role', { count: 'exact' });
      users = usersData || [];
      usersError = usersErr;
    } else {
      users = profilesData || [];
    }

    if (usersError && !users.length) {
      console.error('❌ Error fetching users:', usersError?.message);
    } else {
      console.log(`👥 Users: ${users.length}`);
      users.slice(0, 5).forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
      if (users.length > 5) console.log(`   ... and ${users.length - 5} more`);
    }

    // Count workspaces
    const { data: workspaces, error: wsError } = await oldSupabase
      .from('workspaces')
      .select('id, name', { count: 'exact' });

    if (wsError) {
      console.error('❌ Error fetching workspaces:', wsError.message);
    } else {
      console.log(`\n📦 Workspaces: ${workspaces.length}`);
      workspaces.forEach(w => {
        console.log(`   - ${w.name}`);
      });
    }

    // Count boards by type
    const { data: boards, error: boardError } = await oldSupabase
      .from('boards')
      .select('id, name, type', { count: 'exact' });

    if (boardError) {
      console.error('❌ Error fetching boards:', boardError.message);
    } else {
      console.log(`\n📋 Boards: ${boards.length}`);
      const byType = {};
      boards.forEach(b => {
        byType[b.type] = (byType[b.type] || 0) + 1;
      });
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
      console.log('\n   Board details:');
      boards.forEach(b => {
        console.log(`   - ${b.name} (${b.type})`);
      });
    }

    // Count items by board
    const { data: items, error: itemError } = await oldSupabase
      .from('items')
      .select('id, board_id, title', { count: 'exact' });

    if (itemError) {
      console.error('❌ Error fetching items:', itemError.message);
    } else {
      console.log(`\n✅ Tasks/Items: ${items.length}`);
      const byBoard = {};
      items.forEach(i => {
        byBoard[i.board_id] = (byBoard[i.board_id] || 0) + 1;
      });
      if (boards && boards.length > 0) {
        boards.forEach(b => {
          const count = byBoard[b.id] || 0;
          console.log(`   - ${b.name}: ${count} items`);
        });
      }
    }

    // Count assignees
    const { data: assignees, error: assignError } = await oldSupabase
      .from('item_assignees')
      .select('item_id, user_id', { count: 'exact' });

    if (assignError) {
      console.error('❌ Error fetching assignees:', assignError.message);
    } else {
      console.log(`\n👤 Task Assignments: ${assignees.length}`);
    }

    console.log('\n✅ Analysis complete!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

analyzeOldSystem();
