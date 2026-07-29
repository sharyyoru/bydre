-- Veo Studio — AI image/video generation history
-- Ephemeral media (download-only ~48h); this table persists prompts/settings/status.
-- RLS: members view within workspace, admins manage. Reuses social_monitor_set_updated_at().

CREATE TABLE IF NOT EXISTS public.media_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('image', 'video')),
  model text NOT NULL,
  prompt text NOT NULL,
  negative_prompt text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  operation_name text,
  result jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_generations_workspace ON public.media_generations(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_generations_kind ON public.media_generations(workspace_id, kind);

DROP TRIGGER IF EXISTS trg_media_generations_updated_at ON public.media_generations;
CREATE TRIGGER trg_media_generations_updated_at
  BEFORE UPDATE ON public.media_generations
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

ALTER TABLE public.media_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view media generations" ON public.media_generations;
CREATE POLICY "Members view media generations" ON public.media_generations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = media_generations.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage media generations" ON public.media_generations;
CREATE POLICY "Admins manage media generations" ON public.media_generations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = media_generations.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin')
);

GRANT ALL ON public.media_generations TO authenticated;
