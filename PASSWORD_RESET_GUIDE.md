# Password Reset Guide - Cream CRM Migration

## Why Old Passwords Don't Work

When migrating to a new Supabase project, **password hashes cannot be transferred** for security reasons. This is a Supabase limitation - password hashes are one-way encrypted and cannot be migrated between projects.

**All users must reset their passwords** to use the new Cream CRM system.

---

## Option 1: Send Password Reset Emails (Recommended)

This sends password reset links to all users via email.

### Prerequisites
- Users must have valid email addresses in the system
- Email service must be configured in Supabase

### Steps

1. **Run the password reset script:**
   ```bash
   node --env-file=.env.local scripts/send-password-reset.mjs
   ```

2. **What happens:**
   - Script finds all users in Supabase Auth
   - Generates password reset links for each user
   - Sends reset links to their email addresses

3. **Users receive:**
   - Email with password reset link
   - Link expires in 24 hours
   - Users click link and set new password

### Example Output
```
Fetching all users...
Found 3 users

✅ Password reset link sent to user1@example.com
✅ Password reset link sent to user2@example.com
✅ Password reset link sent to user3@example.com

📊 Summary:
   ✅ Sent: 3
   ❌ Failed: 0

Users can now reset their passwords using the link sent to their email.
```

---

## Option 2: Manually Reset Individual Password

Use this to reset a specific user's password directly.

### Steps

1. **Run the reset script with email and new password:**
   ```bash
   node --env-file=.env.local scripts/reset-user-password.mjs user@example.com newpassword123
   ```

2. **What happens:**
   - Script finds user by email
   - Sets their new password immediately
   - No email is sent

3. **Output:**
   ```
   Resetting password for user@example.com...
   ✅ Password reset successfully for user@example.com

   New credentials:
      Email: user@example.com
      Password: newpassword123
   ```

### Security Note
- Share the new password securely (not via email/chat)
- Ask user to change password on first login
- Use strong passwords (12+ characters, mixed case, numbers, symbols)

---

## Option 3: Manual Reset via Supabase Dashboard

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Users**
3. Find the user you want to reset
4. Click the three-dot menu (⋮)
5. Select **Reset Password**
6. Supabase will send them a reset link via email

---

## Option 4: Create New Users

If you prefer to start fresh without migrating users:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User**
3. Enter email and temporary password
4. User receives confirmation email
5. User sets their own password on first login

---

## Bulk Password Reset (Multiple Users)

If you need to reset passwords for multiple specific users:

1. Create a file `users-to-reset.txt`:
   ```
   user1@example.com
   user2@example.com
   user3@example.com
   ```

2. Run this command:
   ```bash
   cat users-to-reset.txt | while read email; do
     node --env-file=.env.local scripts/reset-user-password.mjs "$email" "TempPassword123!"
   done
   ```

3. Share temporary passwords with users securely
4. Ask them to change passwords on first login

---

## Testing Password Reset

### Test with a New User

1. **Create test user in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User"
   - Email: `test@example.com`
   - Password: `TestPassword123!`

2. **Test login:**
   - Go to https://bydre.vercel.app/login
   - Enter email: `test@example.com`
   - Enter password: `TestPassword123!`
   - Should successfully log in

3. **Test password reset:**
   ```bash
   node --env-file=.env.local scripts/reset-user-password.mjs test@example.com NewPassword456!
   ```

4. **Try new password:**
   - Log out
   - Log in with new password
   - Should work

---

## Troubleshooting

### "User not found" error
- Check email address is correct
- Verify user exists in Supabase Auth dashboard
- Make sure email matches exactly (case-sensitive)

### "Failed to send reset link" error
- Check email configuration in Supabase
- Verify SMTP settings are configured
- Check user's email is valid

### User can't log in after reset
- Verify password was set correctly
- Check for typos in password
- Ensure user is confirmed in Supabase Auth
- Try resetting password again

### "Missing environment variables" error
- Ensure `.env.local` file exists
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Run from project root directory

---

## Best Practices

1. **Notify users in advance**
   - Send announcement about password reset requirement
   - Provide clear instructions
   - Give deadline for password reset

2. **Use strong passwords**
   - Minimum 12 characters
   - Mix uppercase, lowercase, numbers, symbols
   - Avoid dictionary words

3. **Secure password sharing**
   - Never send passwords via email
   - Use secure password manager
   - Share in person or via secure channel

4. **Track reset status**
   - Keep log of who has reset password
   - Follow up with users who haven't reset
   - Disable old accounts after deadline

5. **Test before bulk reset**
   - Test with one user first
   - Verify email delivery works
   - Confirm login works with new password

---

## Scripts Available

| Script | Purpose | Usage |
|--------|---------|-------|
| `send-password-reset.mjs` | Send reset links to all users | `node --env-file=.env.local scripts/send-password-reset.mjs` |
| `reset-user-password.mjs` | Reset specific user password | `node --env-file=.env.local scripts/reset-user-password.mjs <email> <password>` |
| `verify-schema.mjs` | Verify database tables | `node --env-file=.env.local scripts/verify-schema.mjs` |

---

## Support

For issues:
1. Check Supabase dashboard for user status
2. Verify email configuration
3. Check browser console for errors
4. Review Supabase logs for auth errors

---

*Last Updated: July 21, 2026*
