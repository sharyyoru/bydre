import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY;
const NEW_SUPABASE_URL = process.env.SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY || !NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
  console.error('Missing environment variables');
  console.error('Required: OLD_SUPABASE_URL, OLD_SUPABASE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function migrateUsers() {
  console.log('Starting user migration...');

  // Get all users from old bydre Supabase
  const { data: oldUsers, error: fetchError } = await oldSupabase
    .from('profiles')
    .select('id, full_name, email');

  if (fetchError) {
    console.error('Error fetching old users:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${oldUsers.length} users to migrate`);

  // Get workspace members to map roles
  const { data: members, error: memberError } = await oldSupabase
    .from('workspace_members')
    .select('user_id, role');

  if (memberError) {
    console.error('Error fetching workspace members:', memberError);
    process.exit(1);
  }

  const roleMap = {};
  members.forEach(m => {
    roleMap[m.user_id] = m.role;
  });

  let migrated = 0;
  let failed = 0;

  for (const user of oldUsers) {
    try {
      const role = roleMap[user.id] || 'staff';
      
      // Create user in new Supabase with confirmed email
      const { data: newUser, error: createError } = await newSupabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name || user.email.split('@')[0],
        },
      });

      if (createError) {
        console.error(`Failed to create user ${user.email}:`, createError.message);
        failed++;
        continue;
      }

      // Insert into users table with role
      const { error: insertError } = await newSupabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email: user.email,
          full_name: user.full_name,
          role: role,
        });

      if (insertError) {
        console.error(`Failed to insert user ${user.email} into users table:`, insertError.message);
        failed++;
        continue;
      }

      console.log(`✓ Migrated ${user.email} (role: ${role})`);
      migrated++;
    } catch (err) {
      console.error(`Error migrating ${user.email}:`, err.message);
      failed++;
    }
  }

  console.log(`\nMigration complete: ${migrated} succeeded, ${failed} failed`);
  console.log('Users will receive password reset emails at their registered addresses.');
}

migrateUsers().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
