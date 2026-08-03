-- GenieMap assets extension - images, documents, and agent branding
-- ============================================================================

-- 1. Extend geniemap_projects with asset arrays
-- ============================================================================
ALTER TABLE public.geniemap_projects
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documents text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_plans jsonb DEFAULT '[]'::jsonb;

-- 2. Agent branding table for personalized content
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  photo_url text,
  display_name text,
  phone text,
  email text,
  primary_color text DEFAULT '#0f172a',
  secondary_color text DEFAULT '#3b82f6',
  tagline text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_branding_user ON public.agent_branding(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_branding_workspace ON public.agent_branding(workspace_id);

-- 3. Creative assets table for generated content
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.creative_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.geniemap_projects(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type text NOT NULL CHECK (template_type IN (
    'instagram_post', 'instagram_story', 'facebook_post', 
    'property_flyer', 'youtube_thumbnail', 'linkedin_post'
  )),
  branding_type text NOT NULL DEFAULT 'company' CHECK (branding_type IN ('personal', 'company')),
  headline text,
  body_copy text,
  hashtags text[],
  cta text,
  image_url text,
  canva_design_id text,
  canva_edit_url text,
  export_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'exported', 'published')),
  raw jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creative_assets_workspace ON public.creative_assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_project ON public.creative_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_created_by ON public.creative_assets(created_by);

-- 4. Row Level Security
-- ============================================================================
ALTER TABLE public.agent_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

-- Agent branding: users manage their own
DROP POLICY IF EXISTS "Users manage own branding" ON public.agent_branding;
CREATE POLICY "Users manage own branding" ON public.agent_branding FOR ALL USING (
  user_id = auth.uid()
);

-- Creative assets: workspace members can view, creators can manage
DROP POLICY IF EXISTS "Members view creative assets" ON public.creative_assets;
CREATE POLICY "Members view creative assets" ON public.creative_assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = creative_assets.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Creators manage creative assets" ON public.creative_assets;
CREATE POLICY "Creators manage creative assets" ON public.creative_assets FOR ALL USING (
  created_by = auth.uid()
);

-- 5. Grants
-- ============================================================================
GRANT ALL ON public.agent_branding TO authenticated;
GRANT ALL ON public.creative_assets TO authenticated;

-- 6. Add canva to integration_credentials provider check
-- ============================================================================
ALTER TABLE public.integration_credentials 
  DROP CONSTRAINT IF EXISTS integration_credentials_provider_check;

ALTER TABLE public.integration_credentials 
  ADD CONSTRAINT integration_credentials_provider_check 
  CHECK (provider IN ('gemini', 'dubai_pulse', 'youtube', 'meta', 'tiktok', 'geniemap', 'google_maps', 'canva'));
