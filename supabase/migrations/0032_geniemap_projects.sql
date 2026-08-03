-- GenieMap off-plan projects integration
-- Stores cached project inventory from GenieMap API

-- ============================================================================
-- 1. geniemap_projects table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.geniemap_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  external_id integer NOT NULL,
  name text NOT NULL,
  developer_name text,
  developer_id integer,
  district_name text,
  district_id integer,
  status text CHECK (status IN ('available', 'sold_out', 'launch')),
  price_min numeric(18,2),
  price_max numeric(18,2),
  price_per_sqft numeric(12,2),
  area_min numeric(12,2),
  area_max numeric(12,2),
  handover_date date,
  service_charge numeric(12,2),
  eoi_amount numeric(18,2),
  unit_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  latitude double precision,
  longitude double precision,
  image_url text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_geniemap_projects_workspace_id ON public.geniemap_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_geniemap_projects_district ON public.geniemap_projects(district_name);
CREATE INDEX IF NOT EXISTS idx_geniemap_projects_developer ON public.geniemap_projects(developer_name);
CREATE INDEX IF NOT EXISTS idx_geniemap_projects_status ON public.geniemap_projects(status);
CREATE INDEX IF NOT EXISTS idx_geniemap_projects_handover ON public.geniemap_projects(handover_date);

-- ============================================================================
-- 2. Add geniemap to integration_credentials provider enum
-- ============================================================================
ALTER TABLE public.integration_credentials 
  DROP CONSTRAINT IF EXISTS integration_credentials_provider_check;

ALTER TABLE public.integration_credentials 
  ADD CONSTRAINT integration_credentials_provider_check 
  CHECK (provider IN ('gemini', 'dubai_pulse', 'serpapi', 'youtube', 'meta', 'tiktok', 'geniemap', 'google_maps'));

-- ============================================================================
-- 3. Row Level Security
-- ============================================================================
ALTER TABLE public.geniemap_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view geniemap projects" ON public.geniemap_projects;
CREATE POLICY "Members view geniemap projects" ON public.geniemap_projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = geniemap_projects.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage geniemap projects" ON public.geniemap_projects;
CREATE POLICY "Admins manage geniemap projects" ON public.geniemap_projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = geniemap_projects.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

-- ============================================================================
-- 4. Grants
-- ============================================================================
GRANT ALL ON public.geniemap_projects TO authenticated;
