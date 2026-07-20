import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendPasswordResetEmails() {
  console.log('Fetching all users...');

  // Get all users from auth
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();

  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${users.length} users\n`);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
      });

      if (resetError) {
        console.error(`❌ Failed to send reset link to ${user.email}:`, resetError.message);
        failed++;
        continue;
      }

      console.log(`✅ Password reset link sent to ${user.email}`);
      sent++;
    } catch (err) {
      console.error(`❌ Error processing ${user.email}:`, err.message);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\nUsers can now reset their passwords using the link sent to their email.`);
}

sendPasswordResetEmails().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
