import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];
const fullName = process.argv[4] || email.split('@')[0];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

if (!email || !password) {
  console.error('Usage: node create-admin-user.mjs <email> <password> [full-name]');
  console.error('Example: node create-admin-user.mjs wilson@drehomes.com wilsontest Wilson');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdminUser() {
  console.log(`Creating admin user: ${email}...`);

  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      process.exit(1);
    }

    console.log(`✅ Auth user created: ${authUser.user.id}`);

    // Insert into users table with admin role
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email,
        full_name: fullName,
        role: 'admin',
        designation: 'Administrator',
      });

    if (insertError) {
      console.error('Error inserting into users table:', insertError.message);
      process.exit(1);
    }

    console.log(`✅ User record created with admin role`);

    console.log(`\n🎉 Admin user created successfully!`);
    console.log(`\n📋 User Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Full Name: ${fullName}`);
    console.log(`   Role: admin`);
    console.log(`   User ID: ${authUser.user.id}`);
    console.log(`\n✅ User can now log in at https://bydre.vercel.app/login`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdminUser();
