-- Complete Sales Brain & Social Monitor Fix
-- This single migration ensures all required tables, columns, constraints, and policies exist
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- 1. GENIEMAP PROJECTS - Add missing columns
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geniemap_projects' AND table_schema = 'public') THEN
    -- Add crypto columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'accepts_crypto') THEN
      ALTER TABLE geniemap_projects ADD COLUMN accepts_crypto boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'crypto_notes') THEN
      ALTER TABLE geniemap_projects ADD COLUMN crypto_notes text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'popularity_score') THEN
      ALTER TABLE geniemap_projects ADD COLUMN popularity_score numeric(8,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'popularity_signals') THEN
      ALTER TABLE geniemap_projects ADD COLUMN popularity_signals jsonb DEFAULT '{}'::jsonb;
    END IF;
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'images') THEN
      ALTER TABLE geniemap_projects ADD COLUMN images text[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'documents') THEN
      ALTER TABLE geniemap_projects ADD COLUMN documents text[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'description') THEN
      ALTER TABLE geniemap_projects ADD COLUMN description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'amenities') THEN
      ALTER TABLE geniemap_projects ADD COLUMN amenities text[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'payment_plans') THEN
      ALTER TABLE geniemap_projects ADD COLUMN payment_plans jsonb DEFAULT '[]';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. GLOBAL INVESTMENT SENTIMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.global_investment_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  country_name text NOT NULL,
  search_interest integer,
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

-- ============================================================================
-- 3. CRYPTO PROPERTY SENTIMENT TABLE
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

-- ============================================================================
-- 4. DEVELOPER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_id INTEGER,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  total_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  avg_delivery_delay_months NUMERIC(4,1),
  reliability_score NUMERIC(3,2),
  payment_flexibility TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- ============================================================================
-- 5. PROJECT COMMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID,
  project_name TEXT NOT NULL,
  developer_name TEXT,
  base_commission_percent NUMERIC(4,2) NOT NULL DEFAULT 0,
  early_bird_bonus_percent NUMERIC(4,2) DEFAULT 0,
  early_bird_deadline DATE,
  volume_bonus_percent NUMERIC(4,2) DEFAULT 0,
  volume_threshold INTEGER,
  payment_terms TEXT,
  special_incentives TEXT,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_commissions_workspace_active 
  ON project_commissions(workspace_id) WHERE is_active = true;

-- ============================================================================
-- 6. INVENTORY SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID,
  project_name TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_units INTEGER,
  available_units INTEGER,
  sold_units INTEGER,
  reserved_units INTEGER DEFAULT 0,
  avg_price_aed NUMERIC(15,2),
  min_price_aed NUMERIC(15,2),
  max_price_aed NUMERIC(15,2),
  source TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, project_name, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_project_date 
  ON inventory_snapshots(project_id, snapshot_date DESC);

-- ============================================================================
-- 7. SALES OPPORTUNITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID,
  project_name TEXT NOT NULL,
  developer_name TEXT,
  overall_score NUMERIC(5,2) NOT NULL,
  velocity_score NUMERIC(5,2),
  commission_score NUMERIC(5,2),
  demand_score NUMERIC(5,2),
  urgency_score NUMERIC(5,2),
  daily_sales_rate NUMERIC(6,2),
  inventory_remaining_pct NUMERIC(5,2),
  days_to_sellout INTEGER,
  effective_commission_pct NUMERIC(5,2),
  reasoning TEXT,
  key_selling_points TEXT[],
  target_buyer_profile TEXT,
  computed_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ DEFAULT now() + interval '24 hours',
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint for upserts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_opportunities_workspace_project_computed_key') THEN
    ALTER TABLE sales_opportunities 
      ADD CONSTRAINT sales_opportunities_workspace_project_computed_key 
      UNIQUE (workspace_id, project_name, computed_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_workspace_rank 
  ON sales_opportunities(workspace_id, valid_until DESC, rank);

-- ============================================================================
-- 8. MARKET SIGNALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  source TEXT NOT NULL,
  project_id UUID,
  project_name TEXT,
  developer_id UUID,
  developer_name TEXT,
  area_name TEXT,
  title TEXT,
  description TEXT,
  url TEXT,
  sentiment TEXT,
  sentiment_score NUMERIC(3,2),
  reach_estimate INTEGER,
  engagement_count INTEGER,
  trend_value NUMERIC(10,2),
  trend_change_pct NUMERIC(6,2),
  raw_data JSONB,
  signal_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_signals_workspace_date 
  ON market_signals(workspace_id, signal_date DESC);

-- ============================================================================
-- 9. PROJECT ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  project_id UUID,
  project_name TEXT,
  developer_name TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_alerts_workspace_unread 
  ON project_alerts(workspace_id, is_read, triggered_at DESC);

-- ============================================================================
-- 10. DAILY BRIEFINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  top_opportunities JSONB,
  alerts_summary JSONB,
  market_signals_summary JSONB,
  trending_topics JSONB,
  executive_summary TEXT,
  full_content TEXT,
  email_sent_at TIMESTAMPTZ,
  email_recipients TEXT[],
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, briefing_date)
);

-- ============================================================================
-- 11. ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE global_investment_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_property_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. CREATE ALL RLS POLICIES (with IF NOT EXISTS pattern)
-- ============================================================================

-- Helper: Create policy if not exists
DO $$
DECLARE
  policies TEXT[][] := ARRAY[
    -- global_investment_sentiment
    ARRAY['global_investment_sentiment', 'Members view global sentiment', 'SELECT'],
    ARRAY['global_investment_sentiment', 'Service role global_investment_sentiment', 'ALL'],
    -- crypto_property_sentiment
    ARRAY['crypto_property_sentiment', 'Members view crypto sentiment', 'SELECT'],
    ARRAY['crypto_property_sentiment', 'Service role crypto_property_sentiment', 'ALL'],
    -- developer_profiles
    ARRAY['developer_profiles', 'Members view developer profiles', 'SELECT'],
    ARRAY['developer_profiles', 'Service role developer_profiles', 'ALL'],
    -- project_commissions
    ARRAY['project_commissions', 'Members view commissions', 'SELECT'],
    ARRAY['project_commissions', 'Service role project_commissions', 'ALL'],
    -- inventory_snapshots
    ARRAY['inventory_snapshots', 'Members view inventory', 'SELECT'],
    ARRAY['inventory_snapshots', 'Service role inventory_snapshots', 'ALL'],
    -- sales_opportunities
    ARRAY['sales_opportunities', 'Members view opportunities', 'SELECT'],
    ARRAY['sales_opportunities', 'Service role sales_opportunities', 'ALL'],
    -- market_signals
    ARRAY['market_signals', 'Members view signals', 'SELECT'],
    ARRAY['market_signals', 'Service role market_signals', 'ALL'],
    -- project_alerts
    ARRAY['project_alerts', 'Members view alerts', 'SELECT'],
    ARRAY['project_alerts', 'Members update alerts', 'UPDATE'],
    ARRAY['project_alerts', 'Service role project_alerts', 'ALL'],
    -- daily_briefings
    ARRAY['daily_briefings', 'Members view briefings', 'SELECT'],
    ARRAY['daily_briefings', 'Service role daily_briefings', 'ALL']
  ];
BEGIN
  -- Create member SELECT policies
  FOR i IN 1..array_length(policies, 1) LOOP
    IF policies[i][3] = 'SELECT' AND NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = policies[i][1] AND policyname = policies[i][2]
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT USING (
          workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        )',
        policies[i][2], policies[i][1]
      );
    END IF;
  END LOOP;
END $$;

-- Create service role policies for all tables
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'global_investment_sentiment',
    'crypto_property_sentiment', 
    'developer_profiles',
    'project_commissions',
    'inventory_snapshots',
    'sales_opportunities',
    'market_signals',
    'project_alerts',
    'daily_briefings'
  ];
  tbl TEXT;
  policy_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    policy_name := 'Service role full access to ' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = policy_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (auth.role() = ''service_role'')',
        policy_name, tbl
      );
    END IF;
  END LOOP;
END $$;

-- Create admin/owner management policies
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'developer_profiles',
    'project_commissions'
  ];
  tbl TEXT;
  policy_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    policy_name := 'Admins manage ' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = policy_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (
          workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')
          )
        )',
        policy_name, tbl
      );
    END IF;
  END LOOP;
END $$;

-- Alert update policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_alerts' AND policyname = 'Members can update alerts') THEN
    CREATE POLICY "Members can update alerts" ON project_alerts FOR UPDATE
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- 13. GRANTS
-- ============================================================================
GRANT ALL ON global_investment_sentiment TO authenticated;
GRANT ALL ON crypto_property_sentiment TO authenticated;
GRANT ALL ON developer_profiles TO authenticated;
GRANT ALL ON project_commissions TO authenticated;
GRANT ALL ON inventory_snapshots TO authenticated;
GRANT ALL ON sales_opportunities TO authenticated;
GRANT ALL ON market_signals TO authenticated;
GRANT ALL ON project_alerts TO authenticated;
GRANT ALL ON daily_briefings TO authenticated;
GRANT ALL ON geniemap_projects TO authenticated;

-- ============================================================================
-- DONE! All Sales Brain tables and policies are now in place.
-- ============================================================================
