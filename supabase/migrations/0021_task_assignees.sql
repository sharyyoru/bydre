-- Create task_assignees table for multi-owner support with roles
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'other' CHECK (role IN ('shooter', 'editor', 'reviewer', 'other')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id, role)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_task_assignees_item_id ON public.task_assignees(item_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_role ON public.task_assignees(role);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view assignees for items in their workspace
DROP POLICY IF EXISTS "Users can view task assignees in their workspace" ON public.task_assignees;
CREATE POLICY "Users can view task assignees in their workspace"
  ON public.task_assignees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      INNER JOIN public.boards ON items.board_id = boards.id
      INNER JOIN public.workspace_members ON boards.workspace_id = workspace_members.workspace_id
      WHERE items.id = task_assignees.item_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Workspace admins can manage assignees
DROP POLICY IF EXISTS "Workspace admins can manage task assignees" ON public.task_assignees;
CREATE POLICY "Workspace admins can manage task assignees"
  ON public.task_assignees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      INNER JOIN public.boards ON items.board_id = boards.id
      INNER JOIN public.workspace_members ON boards.workspace_id = workspace_members.workspace_id
      WHERE items.id = task_assignees.item_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
