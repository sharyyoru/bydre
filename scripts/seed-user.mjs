import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = "wilson@drehomes.com";
  const password = "wilsontest";

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    process.exit(1);
  }

  const existing = users.users.find((u) => u.email === email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Error updating test user password:", error);
      process.exit(1);
    }

    console.log("Updated test user password:", email);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Wilson Test", role: "admin" },
  });

  if (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }

  console.log("Created test user:", data.user.email);
}

main();
