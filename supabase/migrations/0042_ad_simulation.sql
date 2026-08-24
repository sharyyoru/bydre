-- Ad Simulation System for Real Estate Lead Qualification
-- Imports leads from aesthetic clinic and scores them for investment potential

-- Leads imported from external sources (clinic patients, etc.)
CREATE TABLE IF NOT EXISTS ad_simulation_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Source tracking
  source VARCHAR(100) NOT NULL DEFAULT 'manual',  -- 'aesthetic_clinic', 'manual', 'import'
  source_id VARCHAR(255),  -- Original ID from source system
  
  -- Contact info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(100),
  country VARCHAR(100),
  
  -- Wealth indicators (from source)
  total_spend DECIMAL(14,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_transaction DECIMAL(14,2) GENERATED ALWAYS AS (
    CASE WHEN transaction_count > 0 THEN total_spend / transaction_count ELSE 0 END
  ) STORED,
  
  -- Calculated scores (0-100)
  wealth_score INTEGER DEFAULT 0,
  re_potential_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  
  -- Engagement tracking
  chat_sessions INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  landing_page_visits INTEGER DEFAULT 0,
  ad_clicks INTEGER DEFAULT 0,
  engagement_data JSONB DEFAULT '{}',
  
  -- Qualification status
  status VARCHAR(50) DEFAULT 'imported',  -- 'imported', 'scored', 'engaged', 'qualified', 'contacted', 'converted'
  qualification_notes TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ
);

-- Campaign/Theme configurations
CREATE TABLE IF NOT EXISTS ad_simulation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Theme: crypto, tax, wealth, mixed
  theme VARCHAR(50) NOT NULL DEFAULT 'mixed',
  target_country VARCHAR(100) DEFAULT 'Switzerland',
  
  -- Ad creatives configuration
  ad_creatives JSONB DEFAULT '[]',  -- Array of ad variants
  
  -- Landing page config
  landing_page_config JSONB DEFAULT '{}',
  landing_page_url VARCHAR(500),
  
  -- Chatbot configuration
  chatbot_enabled BOOLEAN DEFAULT true,
  chatbot_system_prompt TEXT,
  chatbot_personality VARCHAR(100) DEFAULT 'professional',
  
  -- Tracking
  leads_count INTEGER DEFAULT 0,
  qualified_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'active', 'paused', 'completed'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Chat sessions for lead engagement simulation
CREATE TABLE IF NOT EXISTS ad_simulation_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES ad_simulation_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ad_simulation_campaigns(id) ON DELETE SET NULL,
  
  -- Chat metadata
  theme VARCHAR(50),  -- Which topic track: crypto, tax, wealth
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Messages stored as JSONB array
  messages JSONB DEFAULT '[]',
  message_count INTEGER DEFAULT 0,
  
  -- Analysis
  sentiment VARCHAR(50),  -- 'positive', 'neutral', 'negative', 'interested'
  topics_discussed TEXT[],
  re_interest_signals JSONB DEFAULT '{}',  -- Signals indicating RE interest
  qualification_triggered BOOLEAN DEFAULT false,
  
  -- Summary
  ai_summary TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing page interactions
CREATE TABLE IF NOT EXISTS ad_simulation_landing_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES ad_simulation_leads(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES ad_simulation_campaigns(id) ON DELETE SET NULL,
  
  -- Visit data
  page_type VARCHAR(50),  -- 'crypto_guide', 'tax_calculator', 'wealth_comparison'
  source VARCHAR(100),  -- 'meta_ad', 'google_ad', 'direct', 'email'
  
  -- Form data captured
  form_submitted BOOLEAN DEFAULT false,
  form_data JSONB DEFAULT '{}',
  
  -- Engagement
  time_on_page INTEGER,  -- seconds
  scroll_depth INTEGER,  -- percentage
  interactions JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_sim_leads_workspace ON ad_simulation_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_sim_leads_status ON ad_simulation_leads(status);
CREATE INDEX IF NOT EXISTS idx_ad_sim_leads_score ON ad_simulation_leads(re_potential_score DESC);
CREATE INDEX IF NOT EXISTS idx_ad_sim_leads_source ON ad_simulation_leads(source);
CREATE INDEX IF NOT EXISTS idx_ad_sim_campaigns_workspace ON ad_simulation_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_sim_chats_lead ON ad_simulation_chats(lead_id);
CREATE INDEX IF NOT EXISTS idx_ad_sim_chats_campaign ON ad_simulation_chats(campaign_id);

-- RLS Policies
ALTER TABLE ad_simulation_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_simulation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_simulation_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_simulation_landing_visits ENABLE ROW LEVEL SECURITY;

-- Workspace member access policies
CREATE POLICY "Workspace members can view leads" ON ad_simulation_leads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage leads" ON ad_simulation_leads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view campaigns" ON ad_simulation_campaigns
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage campaigns" ON ad_simulation_campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view chats" ON ad_simulation_chats
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage chats" ON ad_simulation_chats
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view landing visits" ON ad_simulation_landing_visits
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage landing visits" ON ad_simulation_landing_visits
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Function to calculate wealth score
CREATE OR REPLACE FUNCTION calculate_wealth_score(
  p_total_spend DECIMAL,
  p_transaction_count INTEGER,
  p_email VARCHAR,
  p_phone VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Spending tier (max 40 points)
  IF p_total_spend >= 50000 THEN
    score := score + 40;
  ELSIF p_total_spend >= 30000 THEN
    score := score + 30;
  ELSIF p_total_spend >= 20000 THEN
    score := score + 25;
  ELSIF p_total_spend >= 10000 THEN
    score := score + 15;
  ELSIF p_total_spend >= 5000 THEN
    score := score + 10;
  END IF;
  
  -- Transaction frequency (max 20 points)
  IF p_transaction_count >= 15 THEN
    score := score + 20;
  ELSIF p_transaction_count >= 10 THEN
    score := score + 15;
  ELSIF p_transaction_count >= 5 THEN
    score := score + 10;
  ELSIF p_transaction_count >= 3 THEN
    score := score + 5;
  END IF;
  
  -- International email domain (max 20 points)
  IF p_email IS NOT NULL THEN
    -- Corporate/professional email
    IF p_email NOT LIKE '%gmail.com' 
       AND p_email NOT LIKE '%yahoo.%' 
       AND p_email NOT LIKE '%hotmail.%'
       AND p_email NOT LIKE '%outlook.%' THEN
      score := score + 15;
    END IF;
    -- International TLD
    IF p_email LIKE '%.cy' OR p_email LIKE '%.ru' OR p_email LIKE '%.ae' 
       OR p_email LIKE '%.uk' OR p_email LIKE '%.de' THEN
      score := score + 5;
    END IF;
  END IF;
  
  -- International phone (max 20 points)
  IF p_phone IS NOT NULL THEN
    IF p_phone NOT LIKE '+41%' AND p_phone NOT LIKE '0041%' THEN
      score := score + 20;  -- Non-Swiss number = international
    ELSIF p_phone LIKE '+41 7%' OR p_phone LIKE '+417%' THEN
      score := score + 10;  -- Swiss mobile
    END IF;
  END IF;
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate RE potential score
CREATE OR REPLACE FUNCTION calculate_re_potential(
  p_wealth_score INTEGER,
  p_engagement_score INTEGER,
  p_chat_sessions INTEGER
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
BEGIN
  -- Base from wealth (60% weight)
  score := (p_wealth_score * 0.6)::INTEGER;
  
  -- Engagement bonus (30% weight)
  score := score + (p_engagement_score * 0.3)::INTEGER;
  
  -- Chat engagement bonus (10% weight, max 10 points)
  score := score + LEAST(p_chat_sessions * 2, 10);
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update scores
CREATE OR REPLACE FUNCTION update_lead_scores()
RETURNS TRIGGER AS $$
BEGIN
  NEW.wealth_score := calculate_wealth_score(
    NEW.total_spend,
    NEW.transaction_count,
    NEW.email,
    NEW.phone
  );
  
  NEW.re_potential_score := calculate_re_potential(
    NEW.wealth_score,
    NEW.engagement_score,
    NEW.chat_sessions
  );
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_scores
  BEFORE INSERT OR UPDATE ON ad_simulation_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_scores();
