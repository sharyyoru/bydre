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

  record_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  board_uuid := (record_data->>'board_id')::uuid;
  group_uuid := (record_data->>'group_id')::uuid;
  item_uuid := (record_data->>'id')::uuid;
  SELECT workspace_id INTO workspace_uuid FROM public.boards WHERE id = board_uuid;

  PERFORM public.record_activity(
    workspace_uuid,
    board_uuid,
    group_uuid,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE item_uuid END,
    NULL,
    CASE TG_OP WHEN 'INSERT' THEN 'item.created' WHEN 'UPDATE' THEN 'item.updated' ELSE 'item.deleted' END,
    CASE WHEN record_data->>'parent_id' IS NULL THEN 'item' ELSE 'subitem' END,
    item_uuid,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    jsonb_build_object('deleted_item_id', CASE WHEN TG_OP = 'DELETE' THEN item_uuid ELSE NULL END, 'title', record_data->>'title')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_group_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_uuid uuid;
BEGIN
  SELECT workspace_id INTO workspace_uuid FROM public.boards WHERE id = OLD.board_id;
  PERFORM public.record_activity(
    workspace_uuid,
    OLD.board_id,
    OLD.id,
    NULL,
    NULL,
    'group.deleted',
    'group',
    OLD.id,
    to_jsonb(OLD),
    NULL,
    jsonb_build_object('deleted_group_id', OLD.id, 'name', OLD.name)
  );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS items_activity_audit ON public.items;
DROP TRIGGER IF EXISTS items_activity_delete_audit ON public.items;
CREATE TRIGGER items_activity_audit
  AFTER INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.audit_item_change();
CREATE TRIGGER items_activity_delete_audit
  BEFORE DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.audit_item_change();

DROP TRIGGER IF EXISTS groups_activity_delete_audit ON public.groups;
CREATE TRIGGER groups_activity_delete_audit
  BEFORE DELETE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.audit_group_delete();
