-- Instagram QR Compliance Monitor
-- Monitors agent Instagram posts for required company + project QR codes

-- ============================================================================
-- 1. agent_instagram_accounts - Connected Instagram accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_instagram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id text NOT NULL,
  username text,
  display_name text,
  profile_picture_url text,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked', 'error')),
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, instagram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_instagram_accounts_workspace ON public.agent_instagram_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_instagram_accounts_user ON public.agent_instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_instagram_accounts_status ON public.agent_instagram_accounts(status);

-- ============================================================================
-- 2. compliance_qr_codes - Registered QR codes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compliance_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('company', 'project')),
  project_id uuid REFERENCES public.geniemap_projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  image_url text,
  qr_data text, -- Decoded QR content for matching
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, type, project_id) -- One company QR per workspace, one QR per project
);

CREATE INDEX IF NOT EXISTS idx_compliance_qr_codes_workspace ON public.compliance_qr_codes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_compliance_qr_codes_type ON public.compliance_qr_codes(type);
CREATE INDEX IF NOT EXISTS idx_compliance_qr_codes_project ON public.compliance_qr_codes(project_id);

-- ============================================================================
-- 3. instagram_posts - Ingested posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_account_id uuid NOT NULL REFERENCES public.agent_instagram_accounts(id) ON DELETE CASCADE,
  instagram_media_id text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS')),
  media_url text,
  thumbnail_url text,
  permalink text,
  caption text,
  posted_at timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, instagram_media_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_workspace ON public.instagram_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_agent ON public.instagram_posts(agent_account_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_posted_at ON public.instagram_posts(posted_at DESC);

-- ============================================================================
-- 4. post_compliance_checks - Compliance analysis results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
  is_real_estate_content boolean NOT NULL DEFAULT false,
  real_estate_confidence numeric(5,4), -- 0.0000 to 1.0000
  detected_project_id uuid REFERENCES public.geniemap_projects(id) ON DELETE SET NULL,
  detected_project_name text,
  detected_project_confidence numeric(5,4),
  company_qr_found boolean NOT NULL DEFAULT false,
  project_qr_found boolean NOT NULL DEFAULT false,
  project_qr_correct boolean NOT NULL DEFAULT false,
  detected_qr_codes jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of { data, location, confidence }
  compliance_status text NOT NULL DEFAULT 'pending' CHECK (compliance_status IN (
    'pending',
    'compliant',
    'missing_company_qr',
    'missing_project_qr',
    'wrong_project_qr',
    'not_applicable'
  )),
  ai_analysis_raw jsonb,
  transcript text, -- Audio transcription for videos
  checked_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  UNIQUE (post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_compliance_checks_post ON public.post_compliance_checks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_compliance_checks_status ON public.post_compliance_checks(compliance_status);
CREATE INDEX IF NOT EXISTS idx_post_compliance_checks_project ON public.post_compliance_checks(detected_project_id);

-- ============================================================================
-- 5. compliance_notifications - Notification log
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.compliance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL REFERENCES public.post_compliance_checks(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')),
  notification_type text NOT NULL CHECK (notification_type IN ('violation', 'reminder', 'resolved')),
  message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  UNIQUE (check_id, recipient_user_id, channel, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_compliance_notifications_check ON public.compliance_notifications(check_id);
CREATE INDEX IF NOT EXISTS idx_compliance_notifications_recipient ON public.compliance_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_notifications_unread ON public.compliance_notifications(recipient_user_id, acknowledged_at) WHERE acknowledged_at IS NULL;

-- ============================================================================
-- 6. Row Level Security
-- ============================================================================

-- agent_instagram_accounts
ALTER TABLE public.agent_instagram_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own instagram accounts" ON public.agent_instagram_accounts;
CREATE POLICY "Users view own instagram accounts" ON public.agent_instagram_accounts FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = agent_instagram_accounts.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

DROP POLICY IF EXISTS "Users manage own instagram accounts" ON public.agent_instagram_accounts;
CREATE POLICY "Users manage own instagram accounts" ON public.agent_instagram_accounts FOR ALL USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins manage all instagram accounts" ON public.agent_instagram_accounts;
CREATE POLICY "Admins manage all instagram accounts" ON public.agent_instagram_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = agent_instagram_accounts.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- compliance_qr_codes
ALTER TABLE public.compliance_qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view qr codes" ON public.compliance_qr_codes;
CREATE POLICY "Members view qr codes" ON public.compliance_qr_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = compliance_qr_codes.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage qr codes" ON public.compliance_qr_codes;
CREATE POLICY "Admins manage qr codes" ON public.compliance_qr_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = compliance_qr_codes.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- instagram_posts
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view instagram posts" ON public.instagram_posts;
CREATE POLICY "Members view instagram posts" ON public.instagram_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = instagram_posts.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "System inserts instagram posts" ON public.instagram_posts;
CREATE POLICY "System inserts instagram posts" ON public.instagram_posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = instagram_posts.workspace_id AND wm.user_id = auth.uid())
);

-- post_compliance_checks
ALTER TABLE public.post_compliance_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view compliance checks" ON public.post_compliance_checks;
CREATE POLICY "Members view compliance checks" ON public.post_compliance_checks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.instagram_posts ip
    JOIN public.workspace_members wm ON wm.workspace_id = ip.workspace_id
    WHERE ip.id = post_compliance_checks.post_id AND wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System manages compliance checks" ON public.post_compliance_checks;
CREATE POLICY "System manages compliance checks" ON public.post_compliance_checks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.instagram_posts ip
    JOIN public.workspace_members wm ON wm.workspace_id = ip.workspace_id
    WHERE ip.id = post_compliance_checks.post_id AND wm.user_id = auth.uid()
  )
);

-- compliance_notifications
ALTER TABLE public.compliance_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.compliance_notifications;
CREATE POLICY "Users view own notifications" ON public.compliance_notifications FOR SELECT USING (
  recipient_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users acknowledge own notifications" ON public.compliance_notifications;
CREATE POLICY "Users acknowledge own notifications" ON public.compliance_notifications FOR UPDATE USING (
  recipient_user_id = auth.uid()
);

-- ============================================================================
-- 7. Grants
-- ============================================================================
GRANT ALL ON public.agent_instagram_accounts TO authenticated;
GRANT ALL ON public.compliance_qr_codes TO authenticated;
GRANT ALL ON public.instagram_posts TO authenticated;
GRANT ALL ON public.post_compliance_checks TO authenticated;
GRANT ALL ON public.compliance_notifications TO authenticated;

-- ============================================================================
-- 8. Triggers for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agent_instagram_accounts_updated_at ON public.agent_instagram_accounts;
CREATE TRIGGER update_agent_instagram_accounts_updated_at
  BEFORE UPDATE ON public.agent_instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_qr_codes_updated_at ON public.compliance_qr_codes;
CREATE TRIGGER update_compliance_qr_codes_updated_at
  BEFORE UPDATE ON public.compliance_qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
