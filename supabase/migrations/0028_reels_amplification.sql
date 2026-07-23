-- Reels Amplification module schema
-- Adds: social_accounts, social_posts, social_post_metrics,
--        amplification_campaigns, advocacy_tasks, advocacy_optin, share_links
-- Extends integration_credentials providers to include meta + tiktok.
-- Idempotent: guarded creates + DROP POLICY IF EXISTS. RLS via workspace_members.
-- Reuses public.social_monitor_set_updated_at() from 0025.

-- ============================================================================
-- Extend integration_credentials provider whitelist
-- ============================================================================
ALTER TABLE public.integration_credentials
  DROP CONSTRAINT IF EXISTS integration_credentials_provider_check;
ALTER TABLE public.integration_credentials
  ADD CONSTRAINT integration_credentials_provider_check
  CHECK (provider IN ('gemini', 'dubai_pulse', 'serpapi', 'youtube', 'meta', 'tiktok'));

-- ============================================================================
-- 1. social_accounts — connected brand/agent accounts per platform
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  kind text NOT NULL DEFAULT 'brand' CHECK (kind IN ('brand', 'agent')),
  external_account_id text,
  username text,
  page_id text,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  token_ref text,                       -- key into integration_credentials/secret store (never the raw token)
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'disconnected')),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, external_account_id)
);
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON public.social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_owner ON public.social_accounts(owner_user_id);

DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON public.social_accounts;
CREATE TRIGGER trg_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- 2. social_posts — a published Reel/short across platforms
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  external_id text,
  permalink text,
  caption text,
  media_type text NOT NULL DEFAULT 'reel' CHECK (media_type IN ('reel', 'video', 'story', 'post')),
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  brief_id uuid REFERENCES public.content_briefs(id) ON DELETE SET NULL,
  is_source boolean NOT NULL DEFAULT true,
  source_post_id uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, external_id)
);
CREATE INDEX IF NOT EXISTS idx_social_posts_workspace ON public.social_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON public.social_posts(published_at);

DROP TRIGGER IF EXISTS trg_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER trg_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- 3. social_post_metrics — insights time-series per post
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  views bigint,
  reach bigint,
  likes bigint,
  comments bigint,
  saves bigint,
  shares bigint,
  reposts bigint,
  avg_watch_time numeric(10,2),
  skip_rate numeric(6,2),
  is_first_hour boolean NOT NULL DEFAULT false,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_social_post_metrics_post ON public.social_post_metrics(social_post_id, captured_at);

-- ============================================================================
-- 4. amplification_campaigns — a timed advocacy push for one post
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.amplification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  social_post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz,
  instructions text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amp_campaigns_workspace ON public.amplification_campaigns(workspace_id);

DROP TRIGGER IF EXISTS trg_amp_campaigns_updated_at ON public.amplification_campaigns;
CREATE TRIGGER trg_amp_campaigns_updated_at
  BEFORE UPDATE ON public.amplification_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- 5. advocacy_tasks — per-member actions for a campaign (drives leaderboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advocacy_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.amplification_campaigns(id) ON DELETE CASCADE,
  assignee_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT 'share_story'
    CHECK (action_type IN ('share_story', 'repost', 'dm_share', 'comment', 'save', 'watch')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  points integer NOT NULL DEFAULT 1,
  completed_at timestamptz,
  proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, assignee_user_id, action_type)
);
CREATE INDEX IF NOT EXISTS idx_advocacy_tasks_workspace ON public.advocacy_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_advocacy_tasks_assignee ON public.advocacy_tasks(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_advocacy_tasks_campaign ON public.advocacy_tasks(campaign_id);

DROP TRIGGER IF EXISTS trg_advocacy_tasks_updated_at ON public.advocacy_tasks;
CREATE TRIGGER trg_advocacy_tasks_updated_at
  BEFORE UPDATE ON public.advocacy_tasks
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- 6. advocacy_optin — member consent + connected account
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advocacy_optin (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platforms text[] NOT NULL DEFAULT '{}',
  connected_account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ============================================================================
-- 7. share_links — trackable off-platform share links
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  social_post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  channel text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  clicks integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_share_links_post ON public.share_links(social_post_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amplification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advocacy_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advocacy_optin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Helper predicate inlined per table: member of workspace / admin of workspace.

-- social_accounts: members read, admins manage
DROP POLICY IF EXISTS "Members view social accounts" ON public.social_accounts;
CREATE POLICY "Members view social accounts" ON public.social_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_accounts.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage social accounts" ON public.social_accounts;
CREATE POLICY "Admins manage social accounts" ON public.social_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_accounts.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- social_posts
DROP POLICY IF EXISTS "Members view social posts" ON public.social_posts;
CREATE POLICY "Members view social posts" ON public.social_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_posts.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage social posts" ON public.social_posts;
CREATE POLICY "Admins manage social posts" ON public.social_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_posts.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- social_post_metrics (scoped via parent post's workspace)
DROP POLICY IF EXISTS "Members view post metrics" ON public.social_post_metrics;
CREATE POLICY "Members view post metrics" ON public.social_post_metrics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_posts sp
    JOIN public.workspace_members wm ON wm.workspace_id = sp.workspace_id
    WHERE sp.id = social_post_metrics.social_post_id AND wm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins manage post metrics" ON public.social_post_metrics;
CREATE POLICY "Admins manage post metrics" ON public.social_post_metrics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.social_posts sp
    JOIN public.workspace_members wm ON wm.workspace_id = sp.workspace_id
    WHERE sp.id = social_post_metrics.social_post_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
  )
);

-- amplification_campaigns
DROP POLICY IF EXISTS "Members view campaigns" ON public.amplification_campaigns;
CREATE POLICY "Members view campaigns" ON public.amplification_campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = amplification_campaigns.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.amplification_campaigns;
CREATE POLICY "Admins manage campaigns" ON public.amplification_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = amplification_campaigns.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- advocacy_tasks: assignee sees & updates own; members read; admins manage
DROP POLICY IF EXISTS "Members view advocacy tasks" ON public.advocacy_tasks;
CREATE POLICY "Members view advocacy tasks" ON public.advocacy_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = advocacy_tasks.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Assignee updates own advocacy tasks" ON public.advocacy_tasks;
CREATE POLICY "Assignee updates own advocacy tasks" ON public.advocacy_tasks FOR UPDATE USING (
  assignee_user_id = auth.uid()
) WITH CHECK (assignee_user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage advocacy tasks" ON public.advocacy_tasks;
CREATE POLICY "Admins manage advocacy tasks" ON public.advocacy_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = advocacy_tasks.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- advocacy_optin: user manages own row
DROP POLICY IF EXISTS "User manages own optin" ON public.advocacy_optin;
CREATE POLICY "User manages own optin" ON public.advocacy_optin FOR ALL USING (
  user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins view optin" ON public.advocacy_optin;
CREATE POLICY "Admins view optin" ON public.advocacy_optin FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = advocacy_optin.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- share_links
DROP POLICY IF EXISTS "Members view share links" ON public.share_links;
CREATE POLICY "Members view share links" ON public.share_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = share_links.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Members manage share links" ON public.share_links;
CREATE POLICY "Members manage share links" ON public.share_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = share_links.workspace_id AND wm.user_id = auth.uid())
);

-- ============================================================================
-- Grants (RLS still governs row access for authenticated)
-- ============================================================================
GRANT ALL ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_posts TO authenticated;
GRANT ALL ON public.social_post_metrics TO authenticated;
GRANT ALL ON public.amplification_campaigns TO authenticated;
GRANT ALL ON public.advocacy_tasks TO authenticated;
GRANT ALL ON public.advocacy_optin TO authenticated;
GRANT ALL ON public.share_links TO authenticated;
