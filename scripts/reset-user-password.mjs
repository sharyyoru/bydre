import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userEmail = process.argv[2];
const newPassword = process.argv[3];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

if (!userEmail || !newPassword) {
  console.error('Usage: node reset-user-password.mjs <email> <new-password>');
  console.error('Example: node reset-user-password.mjs user@example.com newpassword123');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetPassword() {
  console.log(`Resetting password for ${userEmail}...`);

  try {
    // First, find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError.message);
      process.exit(1);
    }

    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error(`User ${userEmail} not found`);
      process.exit(1);
    }

    // Update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error resetting password:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ Password reset successfully for ${userEmail}`);
    console.log(`\nNew credentials:`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${newPassword}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetPassword();
