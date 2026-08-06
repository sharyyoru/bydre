-- Global Investment Sentiment & Crypto Property Interest
-- Tracks worldwide interest in UAE property investment

-- ============================================================================
-- 1. Global Investment Sentiment by Country
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.global_investment_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  country_name text NOT NULL,
  search_interest integer, -- 0-100 Google Trends score
  youtube_views bigint,
  youtube_engagement bigint,
  trending_keywords text[] DEFAULT '{}',
  trend_direction text CHECK (trend_direction IN ('up', 'down', 'stable')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  source text NOT NULL DEFAULT 'google_trends',
  raw jsonb DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, country_code, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_global_sentiment_workspace ON public.global_investment_sentiment(workspace_id);
CREATE INDEX IF NOT EXISTS idx_global_sentiment_country ON public.global_investment_sentiment(country_code);
CREATE INDEX IF NOT EXISTS idx_global_sentiment_period ON public.global_investment_sentiment(period_start, period_end);

-- ============================================================================
-- 2. Crypto Property Investment Sentiment
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crypto_property_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('google_trends', 'youtube', 'twitter')),
  search_volume integer,
  engagement_score bigint,
  trend_direction text CHECK (trend_direction IN ('up', 'down', 'stable')),
  week_over_week_change numeric(8,2),
  period_start date NOT NULL,
  period_end date NOT NULL,
  source text NOT NULL DEFAULT 'google_trends',
  raw jsonb DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, keyword, platform, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_crypto_sentiment_workspace ON public.crypto_property_sentiment(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crypto_sentiment_keyword ON public.crypto_property_sentiment(keyword);

-- ============================================================================
-- 3. Add crypto acceptance flag to projects
-- ============================================================================
ALTER TABLE public.geniemap_projects 
  ADD COLUMN IF NOT EXISTS accepts_crypto boolean DEFAULT false;

ALTER TABLE public.geniemap_projects 
  ADD COLUMN IF NOT EXISTS crypto_notes text;

ALTER TABLE public.geniemap_projects 
  ADD COLUMN IF NOT EXISTS popularity_score numeric(8,2);

ALTER TABLE public.geniemap_projects 
  ADD COLUMN IF NOT EXISTS popularity_signals jsonb DEFAULT '{}'::jsonb;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.global_investment_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_property_sentiment ENABLE ROW LEVEL SECURITY;

-- Global sentiment policies
DROP POLICY IF EXISTS "Members view global sentiment" ON public.global_investment_sentiment;
CREATE POLICY "Members view global sentiment" ON public.global_investment_sentiment FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = global_investment_sentiment.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage global sentiment" ON public.global_investment_sentiment;
CREATE POLICY "Admins manage global sentiment" ON public.global_investment_sentiment FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = global_investment_sentiment.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- Crypto sentiment policies
DROP POLICY IF EXISTS "Members view crypto sentiment" ON public.crypto_property_sentiment;
CREATE POLICY "Members view crypto sentiment" ON public.crypto_property_sentiment FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = crypto_property_sentiment.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage crypto sentiment" ON public.crypto_property_sentiment;
CREATE POLICY "Admins manage crypto sentiment" ON public.crypto_property_sentiment FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = crypto_property_sentiment.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- ============================================================================
-- Grants
-- ============================================================================
GRANT ALL ON public.global_investment_sentiment TO authenticated;
GRANT ALL ON public.crypto_property_sentiment TO authenticated;
