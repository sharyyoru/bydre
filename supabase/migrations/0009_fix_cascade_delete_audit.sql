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
  IF item_row.id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT * INTO column_row FROM public.columns WHERE id = COALESCE(NEW.column_id, OLD.column_id);
  PERFORM public.record_activity(
    (SELECT workspace_id FROM public.boards WHERE id = item_row.board_id),
    item_row.board_id,
    item_row.group_id,
    item_row.id,
    column_row.id,
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
  IF item_row.id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  person_id := COALESCE(NEW.user_id, OLD.user_id);
  PERFORM public.record_activity(
    (SELECT workspace_id FROM public.boards WHERE id = item_row.board_id),
    item_row.board_id,
    item_row.group_id,
    item_row.id,
    NULL,
    CASE TG_OP WHEN 'INSERT' THEN 'assignee.added' ELSE 'assignee.removed' END,
    'assignee',
    person_id,
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
  record_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  SELECT * INTO item_row FROM public.items WHERE id = (record_data->>'item_id')::uuid;
  IF item_row.id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public.record_activity(
    (SELECT workspace_id FROM public.boards WHERE id = item_row.board_id),
    item_row.board_id,
    item_row.group_id,
    item_row.id,
    NULL,
    CASE TG_OP WHEN 'INSERT' THEN 'comment.created' WHEN 'UPDATE' THEN 'comment.updated' ELSE 'comment.deleted' END,
    'comment',
    (record_data->>'id')::uuid,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
