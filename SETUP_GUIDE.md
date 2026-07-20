# Setup Guide - Invalid API Key Fix

## Issue: "Invalid API key" when deleting users

The error occurs because the `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is invalid or a placeholder.

## Solution

### Step 1: Get the Correct Service Role Key

1. Go to your Supabase project: https://app.supabase.com
2. Select your project (gqerzivswmhtbwuttsiq)
3. Go to **Settings** → **API**
4. Copy the **Service Role** key (NOT the anon key)
   - It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - It's different from the anon key

### Step 2: Update .env.local

Replace the `SUPABASE_SERVICE_ROLE_KEY` value with the correct key from Step 1:

```env
SUPABASE_SERVICE_ROLE_KEY=<paste-the-correct-service-role-key-here>
```

### Step 3: Restart the Application

After updating `.env.local`, you need to restart your dev server or redeploy:

```bash
# If running locally, restart the dev server
npm run dev

# If deployed on Vercel, update the environment variable:
# 1. Go to Vercel dashboard
# 2. Select your project
# 3. Settings → Environment Variables
# 4. Update SUPABASE_SERVICE_ROLE_KEY
# 5. Redeploy
```

## Why This Matters

The Service Role key is needed for:
- ✅ Creating users
- ✅ Deleting users from workspace
- ✅ Updating user passwords
- ✅ Managing user roles

Without the correct key, these admin operations will fail with "Invalid API key" error.

## Security Note

⚠️ **Never commit `.env.local` to git** - it's already in `.gitignore`
⚠️ **Keep the Service Role key secret** - it has full database access
⚠️ **Use environment variables in Vercel** for production deployments

## Testing

After updating the key, try:
1. Create a new user in the Users page
2. Delete a user from the workspace
3. Change a user's role

All should work without "Invalid API key" errors.
