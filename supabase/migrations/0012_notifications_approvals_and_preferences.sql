ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS board_id uuid REFERENCES public.boards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_item_id ON public.notifications(item_id);

CREATE TABLE IF NOT EXISTS public.board_user_preferences (
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collapsed_group_ids jsonb NOT NULL DEFAULT '[]',
  visible_group_ids jsonb NOT NULL DEFAULT '[]',
  items_per_group integer NOT NULL DEFAULT 50 CHECK (items_per_group BETWEEN 10 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

ALTER TABLE public.board_user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_preferences_owner" ON public.board_user_preferences
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO public.columns (board_id, name, type, position, settings)
SELECT b.id, 'Approval', 'status', 90, '{"options":[{"id":"approval-not-requested","name":"Not requested","color":"#6B7280","position":0},{"id":"approval-needed","name":"Approval needed","color":"#D4AF37","position":1},{"id":"approval-approved","name":"Approved","color":"#10B981","position":2},{"id":"approval-changes","name":"Changes requested","color":"#EF4444","position":3}]}'::jsonb
FROM public.boards b
WHERE b.archived_at IS NULL
ON CONFLICT (board_id, name) DO UPDATE SET settings = EXCLUDED.settings, type = EXCLUDED.type;

INSERT INTO public.columns (board_id, name, type, position, settings)
SELECT b.id, 'Assets', 'text', 91, '{"multi_url":true}'::jsonb
FROM public.boards b
WHERE b.archived_at IS NULL
ON CONFLICT (board_id, name) DO UPDATE SET settings = EXCLUDED.settings, type = EXCLUDED.type;

CREATE OR REPLACE FUNCTION public.enforce_approval_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_column public.columns%ROWTYPE;
  workspace_uuid uuid;
  next_value text;
BEGIN
  SELECT * INTO approval_column FROM public.columns WHERE id = NEW.column_id AND name = 'Approval';
  IF approval_column.id IS NULL THEN RETURN NEW; END IF;
  SELECT b.workspace_id INTO workspace_uuid FROM public.items i JOIN public.boards b ON b.id = i.board_id WHERE i.id = NEW.item_id;
  next_value := NEW.value #>> '{}';
  IF next_value IN ('approval-approved', 'approval-changes') AND NOT public.is_workspace_admin(workspace_uuid) THEN
    RAISE EXCEPTION 'Only workspace admins can approve or request changes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS approval_permission_trigger ON public.item_values;
CREATE TRIGGER approval_permission_trigger BEFORE INSERT OR UPDATE ON public.item_values FOR EACH ROW EXECUTE FUNCTION public.enforce_approval_permission();

CREATE OR REPLACE FUNCTION public.handle_approval_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_column public.columns%ROWTYPE;
  item_row public.items%ROWTYPE;
  workspace_uuid uuid;
  recipient record;
  next_value text;
BEGIN
  SELECT * INTO approval_column FROM public.columns WHERE id = NEW.column_id AND name = 'Approval';
  IF approval_column.id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO item_row FROM public.items WHERE id = NEW.item_id;
  SELECT workspace_id INTO workspace_uuid FROM public.boards WHERE id = item_row.board_id;
  next_value := NEW.value #>> '{}';

  IF next_value = 'approval-needed' THEN
    FOR recipient IN SELECT user_id FROM public.workspace_members WHERE workspace_id = workspace_uuid AND role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, type, source_id, message, board_id, item_id, metadata)
      VALUES (recipient.user_id, 'assignment', item_row.id, 'Approval needed for "' || item_row.title || '"', item_row.board_id, item_row.id, '{"kind":"approval_requested"}');
    END LOOP;
  ELSIF next_value IN ('approval-approved', 'approval-changes') THEN
    FOR recipient IN SELECT user_id FROM public.item_assignees WHERE item_id = item_row.id LOOP
      INSERT INTO public.notifications (user_id, type, source_id, message, board_id, item_id, metadata)
      VALUES (recipient.user_id, 'assignment', item_row.id, '"' || item_row.title || '" was ' || CASE WHEN next_value = 'approval-approved' THEN 'approved' ELSE 'sent back for changes' END, item_row.board_id, item_row.id, jsonb_build_object('kind', next_value));
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.item_assignees WHERE item_id = item_row.id) THEN
      INSERT INTO public.notifications (user_id, type, source_id, message, board_id, item_id, metadata)
      VALUES (item_row.created_by, 'assignment', item_row.id, '"' || item_row.title || '" was ' || CASE WHEN next_value = 'approval-approved' THEN 'approved' ELSE 'sent back for changes' END, item_row.board_id, item_row.id, jsonb_build_object('kind', next_value));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS approval_notification_trigger ON public.item_values;
CREATE TRIGGER approval_notification_trigger AFTER INSERT OR UPDATE ON public.item_values FOR EACH ROW EXECUTE FUNCTION public.handle_approval_notification();
