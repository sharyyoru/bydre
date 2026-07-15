CREATE TABLE IF NOT EXISTS public.import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_system text NOT NULL,
  source_checksum text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  summary jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.import_entity_map (
  source_system text NOT NULL,
  source_id text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  import_run_id uuid REFERENCES public.import_runs(id) ON DELETE SET NULL,
  source_checksum text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_system, source_id, entity_type)
);

CREATE TABLE IF NOT EXISTS public.import_assignment_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id uuid NOT NULL REFERENCES public.import_runs(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  suggested_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (import_run_id, source_name)
);

ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_entity_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_assignment_review ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "import_runs_admin" ON public.import_runs;
DROP POLICY IF EXISTS "import_maps_admin" ON public.import_entity_map;
DROP POLICY IF EXISTS "import_reviews_admin" ON public.import_assignment_review;

CREATE POLICY "import_runs_admin" ON public.import_runs FOR ALL USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));
CREATE POLICY "import_maps_admin" ON public.import_entity_map FOR SELECT USING (EXISTS (SELECT 1 FROM public.import_runs r WHERE r.id = import_run_id AND public.is_workspace_admin(r.workspace_id)));
CREATE POLICY "import_reviews_admin" ON public.import_assignment_review FOR ALL USING (EXISTS (SELECT 1 FROM public.import_runs r WHERE r.id = import_run_id AND public.is_workspace_admin(r.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.import_runs r WHERE r.id = import_run_id AND public.is_workspace_admin(r.workspace_id)));
