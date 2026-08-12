-- Sales Intelligence Brain Schema
-- Transforms Social Monitor into AI-powered sales advisor
-- Uses geniemap_projects (from migration 0032) as the source of truth for projects

-- Developer profiles with track record
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
  reliability_score NUMERIC(3,2), -- 0.00 to 1.00
  payment_flexibility TEXT, -- 'high', 'medium', 'low'
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- Commission rates per project (manual input)
CREATE TABLE IF NOT EXISTS project_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES geniemap_projects(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL, -- Denormalized for quick lookup
  developer_name TEXT,
  base_commission_percent NUMERIC(4,2) NOT NULL DEFAULT 0,
  early_bird_bonus_percent NUMERIC(4,2) DEFAULT 0,
  early_bird_deadline DATE,
  volume_bonus_percent NUMERIC(4,2) DEFAULT 0,
  volume_threshold INTEGER, -- Number of units for volume bonus
  payment_terms TEXT, -- e.g., "50% on booking, 50% on handover"
  special_incentives TEXT, -- Free trips, cars, etc.
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily inventory snapshots for velocity calculation
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES geniemap_projects(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_units INTEGER,
  available_units INTEGER,
  sold_units INTEGER,
  reserved_units INTEGER DEFAULT 0,
  avg_price_aed NUMERIC(15,2),
  min_price_aed NUMERIC(15,2),
  max_price_aed NUMERIC(15,2),
  source TEXT, -- 'geniemap', 'scraper_emaar', 'manual', etc.
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, project_name, snapshot_date)
);

-- AI-scored sales opportunities
CREATE TABLE IF NOT EXISTS sales_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES geniemap_projects(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  developer_name TEXT,
  
  -- Scores (0-100)
  overall_score NUMERIC(5,2) NOT NULL,
  velocity_score NUMERIC(5,2),
  commission_score NUMERIC(5,2),
  demand_score NUMERIC(5,2),
  urgency_score NUMERIC(5,2),
  
  -- Key metrics
  daily_sales_rate NUMERIC(6,2),
  inventory_remaining_pct NUMERIC(5,2),
  days_to_sellout INTEGER,
  effective_commission_pct NUMERIC(5,2),
  
  -- AI reasoning
  reasoning TEXT,
  key_selling_points TEXT[],
  target_buyer_profile TEXT,
  
  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ DEFAULT now() + interval '24 hours',
  rank INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Market/social signals from scraping
CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- 'launch', 'price_change', 'news', 'social', 'trend'
  source TEXT NOT NULL, -- 'google_trends', 'twitter', 'instagram', 'news_rss', 'developer_site'
  
  -- Related entities
  project_id UUID REFERENCES geniemap_projects(id) ON DELETE SET NULL,
  project_name TEXT,
  developer_id UUID REFERENCES developer_profiles(id) ON DELETE SET NULL,
  developer_name TEXT,
  area_name TEXT,
  
  -- Signal data
  title TEXT,
  description TEXT,
  url TEXT,
  sentiment TEXT, -- 'positive', 'negative', 'neutral'
  sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
  reach_estimate INTEGER, -- Estimated audience reached
  engagement_count INTEGER,
  
  -- Trend metrics
  trend_value NUMERIC(10,2),
  trend_change_pct NUMERIC(6,2),
  
  -- Raw data
  raw_data JSONB,
  
  signal_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts for inventory/launch events
CREATE TABLE IF NOT EXISTS project_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'low_inventory', 'new_launch', 'price_change', 'velocity_spike'
  severity TEXT NOT NULL DEFAULT 'info', -- 'critical', 'warning', 'info'
  
  project_id UUID REFERENCES geniemap_projects(id) ON DELETE SET NULL,
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

-- Daily briefings per workspace
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Content sections
  top_opportunities JSONB, -- Array of opportunity summaries
  alerts_summary JSONB,
  market_signals_summary JSONB,
  trending_topics JSONB,
  
  -- AI-generated narrative
  executive_summary TEXT,
  full_content TEXT,
  
  -- Delivery status
  email_sent_at TIMESTAMPTZ,
  email_recipients TEXT[],
  
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workspace_id, briefing_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_project_date 
  ON inventory_snapshots(project_id, snapshot_date DESC);

-- Index for workspace rank lookups (filter by valid_until in queries, not index)
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_workspace_rank 
  ON sales_opportunities(workspace_id, valid_until DESC, rank);

CREATE INDEX IF NOT EXISTS idx_market_signals_workspace_date 
  ON market_signals(workspace_id, signal_date DESC);

CREATE INDEX IF NOT EXISTS idx_project_alerts_workspace_unread 
  ON project_alerts(workspace_id, is_read, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_commissions_workspace_active 
  ON project_commissions(workspace_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

-- RLS policies (workspace members can read, admins can write)
CREATE POLICY "Workspace members can view developer profiles"
  ON developer_profiles FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage developer profiles"
  ON developer_profiles FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  ));

CREATE POLICY "Service role full access to developer_profiles"
  ON developer_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Workspace members can view commissions"
  ON project_commissions FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage commissions"
  ON project_commissions FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  ));

CREATE POLICY "Service role full access to project_commissions"
  ON project_commissions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Workspace members can view inventory snapshots"
  ON inventory_snapshots FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can view opportunities"
  ON sales_opportunities FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can view market signals"
  ON market_signals FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can view alerts"
  ON project_alerts FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can update alert read status"
  ON project_alerts FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can view briefings"
  ON daily_briefings FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Service role bypass for cron jobs and API
CREATE POLICY "Service role full access to inventory_snapshots"
  ON inventory_snapshots FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to sales_opportunities"
  ON sales_opportunities FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to market_signals"
  ON market_signals FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to project_alerts"
  ON project_alerts FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to daily_briefings"
  ON daily_briefings FOR ALL
  USING (auth.role() = 'service_role');
