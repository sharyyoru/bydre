-- ByDre Monday.com-style features migration
-- Adds dynamic columns, sub-items, views, templates, automations, files, archives, and filters.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Existing table refactors
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS position float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_items_parent_id ON public.items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_position ON public.items(position);
CREATE INDEX IF NOT EXISTS idx_items_archived_at ON public.items(archived_at) WHERE archived_at IS NULL;

ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS template_id uuid,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_view text DEFAULT 'table';

CREATE INDEX IF NOT EXISTS idx_boards_archived_at ON public.boards(archived_at) WHERE archived_at IS NULL;

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS position int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_groups_position ON public.groups(position);
CREATE INDEX IF NOT EXISTS idx_groups_archived_at ON public.groups(archived_at) WHERE archived_at IS NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS automation_run_id uuid,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'mention';

-- Board column definitions
CREATE TABLE IF NOT EXISTS public.columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'status', 'priority', 'people', 'date', 'text', 'number', 'dropdown', 'label',
    'checkbox', 'rating', 'email', 'phone', 'url', 'formula', 'dependency', 'progress',
    'currency', 'file', 'mirror'
  )),
  position int NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}',
  is_required boolean NOT NULL DEFAULT false,
  archived_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_columns_board_id ON public.columns(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_position ON public.columns(position);
CREATE INDEX IF NOT EXISTS idx_columns_archived_at ON public.columns(archived_at) WHERE archived_at IS NULL;

-- Per-item cell values
CREATE TABLE IF NOT EXISTS public.item_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(item_id, column_id)
);

CREATE INDEX IF NOT EXISTS idx_item_values_item_id ON public.item_values(item_id);
CREATE INDEX IF NOT EXISTS idx_item_values_column_id ON public.item_values(column_id);

-- Files metadata (objects stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  size bigint,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);

-- File attachments on items
CREATE TABLE IF NOT EXISTS public.item_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_item_files_item_id ON public.item_files(item_id);

-- File attachments on comments
CREATE TABLE IF NOT EXISTS public.comment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_files_comment_id ON public.comment_files(comment_id);

-- Saved board views (table, kanban, calendar, timeline, form, chart, workload, files-map)
CREATE TABLE IF NOT EXISTS public.board_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('table', 'kanban', 'calendar', 'timeline', 'form', 'chart', 'workload', 'files-map')),
  config jsonb NOT NULL DEFAULT '{}',
  position int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(board_id, type)
);

CREATE INDEX IF NOT EXISTS idx_board_views_board_id ON public.board_views(board_id);

-- Board templates
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(type);

-- Connect boards to templates
ALTER TABLE public.boards
  ADD CONSTRAINT fk_boards_template_id FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;

-- Saved filters/sorts per user per board
CREATE TABLE IF NOT EXISTS public.board_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  filter jsonb NOT NULL DEFAULT '{}',
  sort jsonb NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(board_id, user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_board_filters_board_id ON public.board_filters(board_id);

-- Automations
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger text NOT NULL CHECK (trigger IN ('item_created', 'status_changed', 'priority_changed', 'due_date_approaching', 'mention', 'item_assigned', 'item_moved')),
  conditions jsonb NOT NULL DEFAULT '[]',
  actions jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_board_id ON public.automations(board_id);

-- Automation execution logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  output jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON public.automation_logs(automation_id);

-- Archive tables
CREATE TABLE IF NOT EXISTS public.archived_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid NOT NULL,
  board_id uuid NOT NULL,
  group_id uuid,
  title text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  archived_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archived_items_board_id ON public.archived_items(board_id);

CREATE TABLE IF NOT EXISTS public.archived_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  archived_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archived_boards_workspace_id ON public.archived_boards(workspace_id);

-- RLS policies for new tables
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_boards ENABLE ROW LEVEL SECURITY;

-- Reusable helper function: is workspace member?
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = $1 AND user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies are dropped before recreation so this migration can safely rerun.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT * FROM (VALUES
      ('columns', 'columns_select'),
      ('columns', 'columns_manage'),
      ('item_values', 'item_values_select'),
      ('item_values', 'item_values_modify'),
      ('files', 'files_select'),
      ('files', 'files_upload'),
      ('item_files', 'item_files_select'),
      ('item_files', 'item_files_modify'),
      ('comment_files', 'comment_files_select'),
      ('comment_files', 'comment_files_modify'),
      ('board_views', 'board_views_select'),
      ('board_views', 'board_views_modify'),
      ('templates', 'templates_select'),
      ('templates', 'templates_modify'),
      ('board_filters', 'board_filters_select'),
      ('board_filters', 'board_filters_modify'),
      ('automations', 'automations_select'),
      ('automations', 'automations_modify'),
      ('automation_logs', 'automation_logs_select'),
      ('archived_items', 'archived_items_select'),
      ('archived_items', 'archived_items_modify'),
      ('archived_boards', 'archived_boards_select'),
      ('archived_boards', 'archived_boards_modify')
    ) AS policies(table_name, policy_name)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policy_name, policy_record.table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;

-- columns: visible to workspace members of the board's workspace
CREATE POLICY "columns_select" ON public.columns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = columns.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "columns_manage" ON public.columns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id AND wm.role = 'admin'
      WHERE b.id = columns.board_id AND wm.user_id = auth.uid()
    )
  );

-- item_values: visible to workspace members
CREATE POLICY "item_values_select" ON public.item_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE i.id = item_values.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "item_values_modify" ON public.item_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE i.id = item_values.item_id AND wm.user_id = auth.uid()
    )
  );

-- files: visible to workspace members of related items/comments
CREATE POLICY "files_select" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.item_files ifs
      JOIN public.items i ON i.id = ifs.item_id
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE ifs.file_id = files.id AND wm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.comment_files cfs
      JOIN public.comments c ON c.id = cfs.comment_id
      JOIN public.items i ON i.id = c.item_id
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE cfs.file_id = files.id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "files_upload" ON public.files
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- item_files/comment_files: managed by workspace members
CREATE POLICY "item_files_select" ON public.item_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE i.id = item_files.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "item_files_modify" ON public.item_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE i.id = item_files.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comment_files_select" ON public.comment_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.items i ON i.id = c.item_id
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE c.id = comment_files.comment_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comment_files_modify" ON public.comment_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.items i ON i.id = c.item_id
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE c.id = comment_files.comment_id AND wm.user_id = auth.uid()
    )
  );

-- board_views: visible to workspace members, managed by admins or creator
CREATE POLICY "board_views_select" ON public.board_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = board_views.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "board_views_modify" ON public.board_views
  FOR ALL USING (
    created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id AND wm.role = 'admin'
      WHERE b.id = board_views.board_id AND wm.user_id = auth.uid()
    )
  );

-- templates: readable by all, managed by admins
CREATE POLICY "templates_select" ON public.templates
  FOR SELECT USING (true);

CREATE POLICY "templates_modify" ON public.templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- board_filters: per-user filters
CREATE POLICY "board_filters_select" ON public.board_filters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "board_filters_modify" ON public.board_filters
  FOR ALL USING (user_id = auth.uid());

-- automations: visible to workspace members, managed by admins or creator
CREATE POLICY "automations_select" ON public.automations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = automations.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automations_modify" ON public.automations
  FOR ALL USING (
    created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id AND wm.role = 'admin'
      WHERE b.id = automations.board_id AND wm.user_id = auth.uid()
    )
  );

-- automation_logs: visible to workspace members
CREATE POLICY "automation_logs_select" ON public.automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.automations a
      JOIN public.boards b ON b.id = a.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE a.id = automation_logs.automation_id AND wm.user_id = auth.uid()
    )
  );

-- archives: visible to workspace members, managed by admins or archiver
CREATE POLICY "archived_items_select" ON public.archived_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = archived_items.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "archived_items_modify" ON public.archived_items
  FOR ALL USING (
    archived_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = archived_items.board_id AND wm.role = 'admin' AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "archived_boards_select" ON public.archived_boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = archived_boards.workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "archived_boards_modify" ON public.archived_boards
  FOR ALL USING (
    archived_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = archived_boards.workspace_id AND wm.role = 'admin' AND wm.user_id = auth.uid()
    )
  );

-- Update existing policies to include archived_at filter if not already filtered
-- Items visible only if not archived (or explicitly viewing archive)
DROP POLICY IF EXISTS "Items visible to workspace members" ON public.items;
CREATE POLICY "Items visible to workspace members" ON public.items
  FOR SELECT
  USING (
    archived_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = items.board_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Items manageable by workspace members" ON public.items;
CREATE POLICY "Items manageable by workspace members" ON public.items
  FOR ALL
  USING (
    archived_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE b.id = items.board_id AND wm.user_id = auth.uid()
    )
  );

-- Storage setup: create attachments bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for attachments bucket
CREATE POLICY "attachments_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments' AND (
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = storage.objects.name AND f.uploaded_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.item_files ifs
      JOIN public.files f ON f.id = ifs.file_id
      JOIN public.items i ON i.id = ifs.item_id
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE f.storage_path = storage.objects.name AND wm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.comment_files cfs
      JOIN public.files f ON f.id = cfs.file_id
      JOIN public.comments c ON c.id = cfs.comment_id
      JOIN public.items i ON i.id = c.item_id
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE f.storage_path = storage.objects.name AND wm.user_id = auth.uid()
    )
  ));

CREATE POLICY "attachments_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "attachments_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'attachments' AND (
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = storage.objects.name AND f.uploaded_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  ));

-- Helper function: create default columns for a board
CREATE OR REPLACE FUNCTION public.create_default_columns(board_uuid uuid)
RETURNS void AS $$
DECLARE
  col_status uuid;
  col_priority uuid;
  col_owner uuid;
  col_due_date uuid;
  col_start_date uuid;
  col_notes uuid;
  col_progress uuid;
BEGIN
  INSERT INTO public.columns (board_id, name, type, position, settings) VALUES
    (board_uuid, 'Status', 'status', 0, '{"color_mapping": {}}'),
    (board_uuid, 'Priority', 'priority', 1, '{}'),
    (board_uuid, 'Owner', 'people', 2, '{"max": 5}'),
    (board_uuid, 'Start Date', 'date', 3, '{"include_time": false}'),
    (board_uuid, 'Due Date', 'date', 4, '{"include_time": false}'),
    (board_uuid, 'Notes', 'text', 5, '{}'),
    (board_uuid, 'Progress', 'progress', 6, '{"source": "subitems"}')
  RETURNING id INTO col_status;

  -- Default statuses for the Status column (reuse old statuses table where possible)
  INSERT INTO public.statuses (board_id, name, color, position) VALUES
    (board_uuid, 'To Do', '#6B7280', 0),
    (board_uuid, 'In Progress', '#3B82F6', 1),
    (board_uuid, 'Done', '#10B981', 2);

  -- Update column settings with status options
  UPDATE public.columns
  SET settings = jsonb_build_object(
    'options', (
      SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'color', color, 'position', position) ORDER BY position)
      FROM public.statuses WHERE board_id = board_uuid
    )
  )
  WHERE id = col_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill default columns for existing boards that don't have any
DO $$
DECLARE
  b_id uuid;
BEGIN
  FOR b_id IN SELECT id FROM public.boards WHERE archived_at IS NULL
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.columns WHERE board_id = b_id AND archived_at IS NULL) THEN
      PERFORM public.create_default_columns(b_id);
    END IF;
  END LOOP;
END $$;
