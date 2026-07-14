# ByDre

A branded, Monday.com-style project management workspace for DreHomes, built with Next.js 14, Supabase, Tailwind CSS, and shadcn/ui.

## Features

- Branded login screen with seeded test user
- Workspace dashboard with board overview and notifications
- Monday-style board view with groups, items, status, priority, assignees, and due dates
- Calendar view for deadlines
- Item detail drawer with comments and `@user` mentions
- Realtime updates via Supabase Realtime
- Navy/gold DreHomes branding

## Test credentials

- Email: `wilson@drehomes.com`
- Password: `wilsontest`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill in your Supabase keys and app URL.

3. Run the Supabase migration in `supabase/migrations/0001_initial.sql` (via the Supabase SQL editor or CLI).

4. Seed the test user:
   ```bash
   npm run seed:user
   ```

5. Seed the workspace and boards by running the contents of `supabase/seed.sql` in the Supabase SQL editor after the test user exists.

6. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

Connect the GitHub repository to Vercel and set the environment variables from `.env.example`. Ensure the Supabase schema and seeds are applied in production.
