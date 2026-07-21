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

const TEMP_PASSWORD = '000000000000';

async function migrateUsers() {
  console.log('👥 Starting user migration...\n');

  try {
    // Get all users from old system
    const { data: oldUsers, error: fetchError } = await oldSupabase
      .from('profiles')
      .select('id, email, full_name, role');

    if (fetchError) {
      console.error('❌ Error fetching old users:', fetchError.message);
      process.exit(1);
    }

    console.log(`Found ${oldUsers.length} users to migrate\n`);

    if (oldUsers.length === 0) {
      console.log('⚠️  No users found in old system. Skipping migration.');
      return;
    }

    let migrated = 0;
    let failed = 0;
    const userMap = {}; // Map old IDs to new IDs

    for (const oldUser of oldUsers) {
      try {
        console.log(`Migrating ${oldUser.email}...`);

        // Create user in Supabase Auth with temporary password
        const { data: authUser, error: authError } = await newSupabase.auth.admin.createUser({
          email: oldUser.email,
          password: TEMP_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: oldUser.full_name || oldUser.email.split('@')[0],
          },
        });

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already exists')) {
            console.log(`   ⚠️  User already exists, skipping...`);
            migrated++;
            continue;
          }
          console.error(`   ❌ Failed to create auth user:`, authError.message);
          failed++;
          continue;
        }

        const newUserId = authUser.user.id;
        userMap[oldUser.id] = newUserId;

        // Insert into users table with admin role and requires_password_change flag
        const { error: insertError } = await newSupabase
          .from('users')
          .insert({
            id: newUserId,
            email: oldUser.email,
            full_name: oldUser.full_name || oldUser.email.split('@')[0],
            role: oldUser.role || 'staff',
            requires_password_change: true,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`   ❌ Failed to insert into users table:`, insertError.message);
          failed++;
          continue;
        }

        console.log(`   ✅ Migrated (ID: ${newUserId})`);
        migrated++;
      } catch (err) {
        console.error(`   ❌ Error migrating ${oldUser.email}:`, err.message);
        failed++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`\n🔐 All users have temporary password: ${TEMP_PASSWORD}`);
    console.log(`   Users will be forced to change password on first login`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

migrateUsers();
