-- Social Monitor module schema
-- Tables: dld_market_metrics, social_sentiment_metrics, content_briefs,
--         distribution_queue, social_feed_tokens, integration_credentials
-- Idempotent: guarded creates + DROP POLICY IF EXISTS. RLS via workspace_members.

-- ============================================================================
-- Shared updated_at trigger function (reusable)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.social_monitor_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. dld_market_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dld_market_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  area_name text NOT NULL,
  property_type text,
  registration_type text NOT NULL CHECK (registration_type IN ('off_plan', 'ready')),
  transaction_count integer NOT NULL DEFAULT 0,
  total_value_aed numeric(18,2) NOT NULL DEFAULT 0,
  avg_value_aed numeric(18,2) NOT NULL DEFAULT 0,
  median_value_aed numeric(18,2),
  roi_percent numeric(6,2),
  period_start date NOT NULL,
  period_end date NOT NULL,
  source text NOT NULL DEFAULT 'dubai_pulse',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, area_name, registration_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_dld_market_metrics_workspace_id ON public.dld_market_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dld_market_metrics_area ON public.dld_market_metrics(area_name);
CREATE INDEX IF NOT EXISTS idx_dld_market_metrics_period ON public.dld_market_metrics(period_start, period_end);

-- ============================================================================
-- 2. social_sentiment_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_sentiment_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('google_trends', 'youtube')),
  search_volume integer,
  velocity numeric(10,2),
  engagement_score numeric(12,2),
  video_count integer,
  geo text NOT NULL DEFAULT 'AE',
  period_start date NOT NULL,
  period_end date NOT NULL,
  source text NOT NULL DEFAULT 'serpapi',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, keyword, platform, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_social_sentiment_workspace_id ON public.social_sentiment_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_sentiment_keyword ON public.social_sentiment_metrics(keyword);
CREATE INDEX IF NOT EXISTS idx_social_sentiment_platform ON public.social_sentiment_metrics(platform);

-- ============================================================================
-- 3. content_briefs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  angle text,
  hook text,
  summary text,
  platform_copy jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_area text,
  keywords text[] NOT NULL DEFAULT '{}',
  arbitrage_score numeric(8,2),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'scheduled', 'published')),
  source_market_metric_id uuid REFERENCES public.dld_market_metrics(id) ON DELETE SET NULL,
  source_sentiment_metric_id uuid REFERENCES public.social_sentiment_metrics(id) ON DELETE SET NULL,
  generated_by text NOT NULL DEFAULT 'gemini',
  model text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_briefs_workspace_id ON public.content_briefs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_briefs_status ON public.content_briefs(status);

DROP TRIGGER IF EXISTS trg_content_briefs_updated_at ON public.content_briefs;
CREATE TRIGGER trg_content_briefs_updated_at
  BEFORE UPDATE ON public.content_briefs
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- 4. distribution_queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.distribution_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brief_id uuid NOT NULL REFERENCES public.content_briefs(id) ON DELETE CASCADE,
  platform text NOT NULL,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'published', 'failed', 'cancelled')),
  external_id text,
  external_url text,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_distribution_queue_workspace_id ON public.distribution_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_distribution_queue_brief_id ON public.distribution_queue(brief_id);
CREATE INDEX IF NOT EXISTS idx_distribution_queue_status ON public.distribution_queue(status);

DROP TRIGGER IF EXISTS trg_distribution_queue_updated_at ON public.distribution_queue;
CREATE TRIGGER trg_distribution_queue_updated_at
  BEFORE UPDATE ON public.distribution_queue
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- 5. social_feed_tokens (syndication feed auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_feed_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  revoked_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_feed_tokens_workspace_id ON public.social_feed_tokens(workspace_id);

-- ============================================================================
-- 6. integration_credentials (runtime API keys — service-role only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('gemini', 'dubai_pulse', 'serpapi', 'youtube')),
  secret text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_four text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_workspace_id ON public.integration_credentials(workspace_id);

DROP TRIGGER IF EXISTS trg_integration_credentials_updated_at ON public.integration_credentials;
CREATE TRIGGER trg_integration_credentials_updated_at
  BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.dld_market_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_sentiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_feed_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

-- Members can read; admins can manage. (Metrics/briefs/queue)
-- dld_market_metrics
DROP POLICY IF EXISTS "Members view market metrics" ON public.dld_market_metrics;
CREATE POLICY "Members view market metrics" ON public.dld_market_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = dld_market_metrics.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage market metrics" ON public.dld_market_metrics;
CREATE POLICY "Admins manage market metrics" ON public.dld_market_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = dld_market_metrics.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- social_sentiment_metrics
DROP POLICY IF EXISTS "Members view sentiment metrics" ON public.social_sentiment_metrics;
CREATE POLICY "Members view sentiment metrics" ON public.social_sentiment_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_sentiment_metrics.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage sentiment metrics" ON public.social_sentiment_metrics;
CREATE POLICY "Admins manage sentiment metrics" ON public.social_sentiment_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_sentiment_metrics.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- content_briefs
DROP POLICY IF EXISTS "Members view content briefs" ON public.content_briefs;
CREATE POLICY "Members view content briefs" ON public.content_briefs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = content_briefs.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage content briefs" ON public.content_briefs;
CREATE POLICY "Admins manage content briefs" ON public.content_briefs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = content_briefs.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- distribution_queue
DROP POLICY IF EXISTS "Members view distribution queue" ON public.distribution_queue;
CREATE POLICY "Members view distribution queue" ON public.distribution_queue FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = distribution_queue.workspace_id AND wm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage distribution queue" ON public.distribution_queue;
CREATE POLICY "Admins manage distribution queue" ON public.distribution_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = distribution_queue.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- social_feed_tokens: admins only (metadata). Secret hash never exposed via UI selects.
DROP POLICY IF EXISTS "Admins manage feed tokens" ON public.social_feed_tokens;
CREATE POLICY "Admins manage feed tokens" ON public.social_feed_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = social_feed_tokens.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- integration_credentials: NO client policies (service-role only). RLS enabled with
-- no policies => all client (anon/authenticated) access is denied. Server uses service role.

-- ============================================================================
-- Grants (RLS still governs row access for authenticated)
-- ============================================================================
GRANT ALL ON public.dld_market_metrics TO authenticated;
GRANT ALL ON public.social_sentiment_metrics TO authenticated;
GRANT ALL ON public.content_briefs TO authenticated;
GRANT ALL ON public.distribution_queue TO authenticated;
GRANT ALL ON public.social_feed_tokens TO authenticated;
-- integration_credentials intentionally NOT granted to authenticated.
