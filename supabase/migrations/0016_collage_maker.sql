-- Collage Maker Tables and Functions

-- Table for storing collage projects
CREATE TABLE IF NOT EXISTS public.collage_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  shape_type text NOT NULL CHECK (shape_type IN ('template', 'custom')),
  shape_name text,
  shape_svg_path text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{
    "gridRows": 10,
    "gridCols": 10,
    "padding": 5,
    "effect": "color",
    "gradientColors": null
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for storing uploaded collage images
CREATE TABLE IF NOT EXISTS public.collage_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collage_projects_user_id ON public.collage_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_collage_projects_workspace_id ON public.collage_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_collage_projects_created_at ON public.collage_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collage_images_user_id ON public.collage_images(user_id);
CREATE INDEX IF NOT EXISTS idx_collage_images_workspace_id ON public.collage_images(workspace_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_collage_project_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_collage_projects_updated_at
  BEFORE UPDATE ON public.collage_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collage_project_updated_at();

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE public.collage_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collage_images ENABLE ROW LEVEL SECURITY;

-- Collage Projects Policies
CREATE POLICY "Users can view their own collage projects"
  ON public.collage_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collage projects"
  ON public.collage_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collage projects"
  ON public.collage_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collage projects"
  ON public.collage_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Collage Images Policies
CREATE POLICY "Users can view their own collage images"
  ON public.collage_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collage images"
  ON public.collage_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collage images"
  ON public.collage_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.collage_projects TO authenticated;
GRANT ALL ON public.collage_images TO authenticated;
