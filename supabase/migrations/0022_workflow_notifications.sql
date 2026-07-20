-- Create workflow_notifications table for admin alerts
CREATE TABLE IF NOT EXISTS public.workflow_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('assign_shooter', 'assign_editor', 'assign_reviewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  completed_at timestamptz,
  UNIQUE(item_id, notification_type, status)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_workspace_id ON public.workflow_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_item_id ON public.workflow_notifications(item_id);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_status ON public.workflow_notifications(status);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_type ON public.workflow_notifications(notification_type);

-- Enable RLS
ALTER TABLE public.workflow_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Workspace admins can view notifications
CREATE POLICY "Workspace admins can view workflow notifications"
  ON public.workflow_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workflow_notifications.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- RLS Policy: Workspace admins can manage notifications
CREATE POLICY "Workspace admins can manage workflow notifications"
  ON public.workflow_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workflow_notifications.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );
