ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  column_id uuid REFERENCES public.columns(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_type text NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'automation', 'system')),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_workspace_created ON public.activity_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_board_created ON public.activity_events(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_item_created ON public.activity_events(item_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS "Workspaces readable by members" ON public.workspaces;
DROP POLICY IF EXISTS "Workspaces updatable by admins" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace members readable by members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace members manageable by admins" ON public.workspace_members;
DROP POLICY IF EXISTS "Boards readable by workspace members" ON public.boards;
DROP POLICY IF EXISTS "Boards manageable by workspace members" ON public.boards;
DROP POLICY IF EXISTS "Groups readable by board workspace members" ON public.groups;
DROP POLICY IF EXISTS "Groups manageable by workspace members" ON public.groups;
DROP POLICY IF EXISTS "Statuses readable by board workspace members" ON public.statuses;
DROP POLICY IF EXISTS "Statuses manageable by workspace members" ON public.statuses;
DROP POLICY IF EXISTS "Items readable by board workspace members" ON public.items;
DROP POLICY IF EXISTS "Items manageable by workspace members" ON public.items;
DROP POLICY IF EXISTS "Items visible to workspace members" ON public.items;
DROP POLICY IF EXISTS "Item assignees readable by board workspace members" ON public.item_assignees;
DROP POLICY IF EXISTS "Item assignees manageable by workspace members" ON public.item_assignees;
DROP POLICY IF EXISTS "Comments readable by board workspace members" ON public.comments;
DROP POLICY IF EXISTS "Comments manageable by workspace members" ON public.comments;
DROP POLICY IF EXISTS "columns_manage" ON public.columns;
DROP POLICY IF EXISTS "board_views_modify" ON public.board_views;
DROP POLICY IF EXISTS "automations_modify" ON public.automations;

CREATE POLICY "workspace_member_select" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));
CREATE POLICY "workspace_admin_update" ON public.workspaces
  FOR UPDATE USING (public.is_workspace_admin(id)) WITH CHECK (public.is_workspace_admin(id));
CREATE POLICY "workspace_member_list" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "workspace_admin_manage_members" ON public.workspace_members
  FOR ALL USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));
CREATE POLICY "workspace_member_boards" ON public.boards
  FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "workspace_member_groups" ON public.groups
  FOR ALL USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = groups.board_id AND public.is_workspace_member(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = groups.board_id AND public.is_workspace_member(b.workspace_id)));
CREATE POLICY "workspace_member_statuses" ON public.statuses
  FOR ALL USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = statuses.board_id AND public.is_workspace_member(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = statuses.board_id AND public.is_workspace_member(b.workspace_id)));
CREATE POLICY "workspace_member_items" ON public.items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = items.board_id AND public.is_workspace_member(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = items.board_id AND public.is_workspace_member(b.workspace_id)));
CREATE POLICY "workspace_member_assignees" ON public.item_assignees
  FOR ALL USING (EXISTS (SELECT 1 FROM public.items i JOIN public.boards b ON b.id = i.board_id WHERE i.id = item_assignees.item_id AND public.is_workspace_member(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.items i JOIN public.boards b ON b.id = i.board_id WHERE i.id = item_assignees.item_id AND public.is_workspace_member(b.workspace_id)));
CREATE POLICY "workspace_member_comments" ON public.comments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.items i JOIN public.boards b ON b.id = i.board_id WHERE i.id = comments.item_id AND public.is_workspace_member(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.items i JOIN public.boards b ON b.id = i.board_id WHERE i.id = comments.item_id AND public.is_workspace_member(b.workspace_id)));
CREATE POLICY "workspace_admin_columns" ON public.columns
  FOR ALL USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = columns.board_id AND public.is_workspace_admin(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = columns.board_id AND public.is_workspace_admin(b.workspace_id)));
CREATE POLICY "workspace_admin_views" ON public.board_views
  FOR ALL USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_views.board_id AND public.is_workspace_admin(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = board_views.board_id AND public.is_workspace_admin(b.workspace_id)));
CREATE POLICY "workspace_admin_automations" ON public.automations
  FOR ALL USING (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = automations.board_id AND public.is_workspace_admin(b.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards b WHERE b.id = automations.board_id AND public.is_workspace_admin(b.workspace_id)));

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_member_board_read" ON public.activity_events
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
    AND (board_id IS NOT NULL OR event_type NOT LIKE 'user.%')
  );
CREATE POLICY "activity_admin_security_read" ON public.activity_events
  FOR SELECT USING (public.is_workspace_admin(workspace_id));

CREATE OR REPLACE FUNCTION public.record_activity(
  p_workspace_id uuid,
  p_board_id uuid,
  p_group_id uuid,
  p_item_id uuid,
  p_column_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb,
  p_after jsonb,
  p_metadata jsonb DEFAULT '{}',
  p_actor_type text DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_events (
    workspace_id, board_id, group_id, item_id, column_id, actor_id, actor_type,
    event_type, entity_type, entity_id, before_data, after_data, metadata
  ) VALUES (
    p_workspace_id, p_board_id, p_group_id, p_item_id, p_column_id, auth.uid(), p_actor_type,
    p_event_type, p_entity_type, p_entity_id, p_before, p_after, COALESCE(p_metadata, '{}')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_item_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  NEW.last_activity_at = now();
  NEW.last_activity_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS items_touch_activity ON public.items;
CREATE TRIGGER items_touch_activity
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.touch_item_activity();

CREATE OR REPLACE FUNCTION public.audit_item_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_data jsonb;
  workspace_uuid uuid;
  board_uuid uuid;
  group_uuid uuid;
  item_uuid uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    record_data := to_jsonb(OLD);
  ELSE
    record_data := to_jsonb(NEW);
  END IF;
  board_uuid := (record_data->>'board_id')::uuid;
  group_uuid := (record_data->>'group_id')::uuid;
  item_uuid := (record_data->>'id')::uuid;
  SELECT workspace_id INTO workspace_uuid FROM public.boards WHERE id = board_uuid;
  PERFORM public.record_activity(
    workspace_uuid, board_uuid, group_uuid, item_uuid, NULL,
    CASE TG_OP WHEN 'INSERT' THEN 'item.created' WHEN 'UPDATE' THEN 'item.updated' ELSE 'item.deleted' END,
    CASE WHEN record_data->>'parent_id' IS NULL THEN 'item' ELSE 'subitem' END,
    item_uuid,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_item_value_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_row public.items%ROWTYPE;
  column_row public.columns%ROWTYPE;
BEGIN
  SELECT * INTO item_row FROM public.items WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  SELECT * INTO column_row FROM public.columns WHERE id = COALESCE(NEW.column_id, OLD.column_id);
  PERFORM public.record_activity(
    (SELECT workspace_id FROM public.boards WHERE id = item_row.board_id),
    item_row.board_id, item_row.group_id, item_row.id, column_row.id,
    CASE TG_OP WHEN 'INSERT' THEN 'value.set' WHEN 'UPDATE' THEN 'value.updated' ELSE 'value.cleared' END,
    'item_value', COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE jsonb_build_object('value', OLD.value) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE jsonb_build_object('value', NEW.value) END,
    jsonb_build_object('column_name', column_row.name, 'column_type', column_row.type)
  );
  UPDATE public.items SET last_activity_at = now(), last_activity_by = auth.uid() WHERE id = item_row.id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_assignee_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_row public.items%ROWTYPE;
  person_id uuid;
BEGIN
  SELECT * INTO item_row FROM public.items WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  person_id := COALESCE(NEW.user_id, OLD.user_id);
  PERFORM public.record_activity(
    (SELECT workspace_id FROM public.boards WHERE id = item_row.board_id),
    item_row.board_id, item_row.group_id, item_row.id, NULL,
    CASE TG_OP WHEN 'INSERT' THEN 'assignee.added' ELSE 'assignee.removed' END,
    'assignee', person_id,
    CASE WHEN TG_OP = 'DELETE' THEN jsonb_build_object('user_id', person_id) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN jsonb_build_object('user_id', person_id) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_comment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_row public.items%ROWTYPE;
  record_data jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    record_data := to_jsonb(OLD);
  ELSE
    record_data := to_jsonb(NEW);
  END IF;
  SELECT * INTO item_row FROM public.items WHERE id = (record_data->>'item_id')::uuid;
  PERFORM public.record_activity(
    (SELECT workspace_id FROM public.boards WHERE id = item_row.board_id),
    item_row.board_id, item_row.group_id, item_row.id, NULL,
    CASE TG_OP WHEN 'INSERT' THEN 'comment.created' WHEN 'UPDATE' THEN 'comment.updated' ELSE 'comment.deleted' END,
    'comment', (record_data->>'id')::uuid,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS items_activity_audit ON public.items;
DROP TRIGGER IF EXISTS item_values_activity_audit ON public.item_values;
DROP TRIGGER IF EXISTS item_assignees_activity_audit ON public.item_assignees;
DROP TRIGGER IF EXISTS comments_activity_audit ON public.comments;
CREATE TRIGGER items_activity_audit AFTER INSERT OR UPDATE OR DELETE ON public.items FOR EACH ROW EXECUTE FUNCTION public.audit_item_change();
CREATE TRIGGER item_values_activity_audit AFTER INSERT OR UPDATE OR DELETE ON public.item_values FOR EACH ROW EXECUTE FUNCTION public.audit_item_value_change();
CREATE TRIGGER item_assignees_activity_audit AFTER INSERT OR DELETE ON public.item_assignees FOR EACH ROW EXECUTE FUNCTION public.audit_assignee_change();
CREATE TRIGGER comments_activity_audit AFTER INSERT OR UPDATE OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.audit_comment_change();

INSERT INTO public.groups (board_id, name, color, position)
SELECT b.id, defaults.name, defaults.color, defaults.position
FROM public.boards b
JOIN (VALUES
  ('Shoots', 'Pre-Production', '#D4AF37', 0), ('Shoots', 'This Month', '#0A1628', 1), ('Shoots', 'Post-Production', '#6B7280', 2),
  ('Content Calendar', 'Ideas', '#D4AF37', 0), ('Content Calendar', 'Scheduled', '#0A1628', 1), ('Content Calendar', 'Published', '#10B981', 2),
  ('Tasks', 'Backlog', '#D4AF37', 0), ('Tasks', 'Sprint', '#0A1628', 1), ('Tasks', 'Done', '#10B981', 2)
) AS defaults(board_name, name, color, position) ON defaults.board_name = b.name
WHERE b.archived_at IS NULL
ON CONFLICT (board_id, name) DO UPDATE SET color = EXCLUDED.color, position = EXCLUDED.position;

INSERT INTO public.columns (board_id, name, type, position, settings)
SELECT b.id, defaults.name, defaults.type, defaults.position, defaults.settings::jsonb
FROM public.boards b
JOIN (VALUES
  ('Shoots', 'Location', 'text', 7, '{}'), ('Shoots', 'Crew', 'dropdown', 8, '{"options":[{"id":"crew-small","name":"Small","color":"#6B7280"},{"id":"crew-medium","name":"Medium","color":"#3B82F6"},{"id":"crew-large","name":"Large","color":"#D4AF37"}]}'), ('Shoots', 'Equipment', 'text', 9, '{}'), ('Shoots', 'Budget', 'currency', 10, '{"currency":"USD","precision":2}'),
  ('Content Calendar', 'Platform', 'dropdown', 7, '{"options":[{"id":"platform-instagram","name":"Instagram","color":"#E1306C"},{"id":"platform-tiktok","name":"TikTok","color":"#000000"},{"id":"platform-youtube","name":"YouTube","color":"#FF0000"},{"id":"platform-linkedin","name":"LinkedIn","color":"#0A66C2"}]}'), ('Content Calendar', 'Publish Date', 'date', 8, '{"include_time":false}'), ('Content Calendar', 'Asset URL', 'url', 9, '{}'), ('Content Calendar', 'Hashtags', 'text', 10, '{}'),
  ('Tasks', 'Sprint Points', 'number', 7, '{"min":0,"max":100}'), ('Tasks', 'Tags', 'label', 8, '{"options":[{"id":"tag-urgent","name":"Urgent","color":"#EF4444"},{"id":"tag-bug","name":"Bug","color":"#F97316"},{"id":"tag-feature","name":"Feature","color":"#10B981"},{"id":"tag-design","name":"Design","color":"#8B5CF6"}]}'), ('Tasks', 'Department', 'dropdown', 9, '{"options":[{"id":"dept-marketing","name":"Marketing","color":"#3B82F6"},{"id":"dept-operations","name":"Operations","color":"#D4AF37"},{"id":"dept-creative","name":"Creative","color":"#EC4899"}]}')
) AS defaults(board_name, name, type, position, settings) ON defaults.board_name = b.name
WHERE b.archived_at IS NULL
ON CONFLICT (board_id, name) DO UPDATE SET type = EXCLUDED.type, position = EXCLUDED.position, settings = EXCLUDED.settings;
