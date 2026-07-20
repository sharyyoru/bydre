# Cream CRM Integration - DreHomes Migration Guide

## Overview

This branch (`cream-replacement`) replaces the bydre application with the Cream CRM system, rebranded as **DreHomes**.

### What Changed

- **Codebase**: Entire Cream source code (Next.js 16, React 19, Tailwind 4)
- **Branding**: Logo and title updated to DreHomes
- **Database**: Cream schema with `patients` renamed to `agents`
- **Data**: Boards → Projects, Items → Tasks migration scripts included

## Pre-Migration Checklist

- [ ] Backup current bydre Supabase database
- [ ] Document current bydre Supabase URL and API keys
- [ ] Create new Supabase project for DreHomes
- [ ] Confirm all users have valid email addresses in old system

## Step 1: Set Up New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note the new project URL and service role key
3. In the SQL editor, run the migration:
   ```sql
   -- Run the Cream schema migration
   -- File: supabase/migrations/0018_cream_schema.sql
   ```

## Step 2: Migrate Users

Users will be created with confirmed emails but will need to reset their passwords.

### Environment Setup

Create a `.env.local` file with:

```bash
# Old bydre Supabase
OLD_SUPABASE_URL=https://your-old-project.supabase.co
OLD_SUPABASE_KEY=your-old-anon-key

# New DreHomes Supabase
SUPABASE_URL=https://your-new-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

### Run Migration

```bash
node --env-file=.env.local scripts/migrate-users.mjs
```

**Output**: Users will be created in the new Supabase project with their roles preserved. They will receive password reset emails.

## Step 3: Migrate Tasks (Boards → Projects, Items → Tasks)

### Run Migration

```bash
node --env-file=.env.local scripts/migrate-tasks.mjs
```

**Mapping**:
- Each bydre **board** becomes a Cream **project**
- Each bydre **item** becomes a Cream **task**
- Status, priority, due dates, and assignees are preserved
- Sub-items are excluded (only top-level items migrated)

## Step 4: Update Environment Variables

Update `.env.local` with the new Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```

## Step 5: Deploy

```bash
npm install
npm run build
npm run start
```

Or deploy to your hosting provider (Vercel, Netlify, etc.)

## Post-Migration

### User Communication

Send users an email:

> **Subject**: DreHomes Platform Launch - Password Reset Required
>
> We've upgraded to a new platform called DreHomes. Please reset your password using the link sent to your email. Your login email remains the same.

### Verify Data

1. **Check users**: Navigate to `/users` and confirm all users are present
2. **Check projects**: Navigate to `/projects` and confirm all boards are now projects
3. **Check tasks**: Open a project and verify tasks are present
4. **Check agents**: Navigate to `/agents` (formerly patients) and confirm the module works

### Known Limitations

- **Patients → Agents**: The module is renamed but still contains medical/patient-related fields. Customize as needed.
- **Attachments**: File attachments are not automatically migrated. Users may need to re-upload.
- **Comments**: Historical comments are not migrated. Consider archiving old data separately.
- **Custom columns**: bydre's custom item columns are not mapped. Data is preserved in metadata.

## Rollback Plan

If issues arise:

1. Keep the old bydre Supabase project active
2. Revert DNS/deployment to point to the old app
3. Investigate issues in the new environment
4. Re-run migrations if needed

## Support

For issues:

1. Check the migration logs for errors
2. Verify environment variables are correct
3. Ensure Supabase projects are accessible
4. Check that users have valid email addresses

---

**Migration Date**: [INSERT DATE]
**Migrated By**: [INSERT NAME]
**Status**: [PENDING / IN PROGRESS / COMPLETE]
