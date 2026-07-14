-- Automation triggers and functions
-- When an item's status column changes to a status whose name is 'Done', notify the board members.

CREATE OR REPLACE FUNCTION public.handle_item_value_change()
RETURNS trigger AS $$
DECLARE
  col public.columns%ROWTYPE;
  status_name text;
  status_color text;
  item_title text;
  board_id uuid;
  item_board_id uuid;
  ws_id uuid;
  member_rec record;
BEGIN
  SELECT * INTO col FROM public.columns WHERE id = NEW.column_id AND type = 'status' LIMIT 1;
  IF col.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT i.board_id, i.title INTO item_board_id, item_title
  FROM public.items i
  WHERE i.id = NEW.item_id;

  IF item_board_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT b.workspace_id INTO ws_id FROM public.boards b WHERE b.id = item_board_id;

  -- Find status name from the column settings options
  SELECT opt.value->>'name' INTO status_name
  FROM jsonb_array_elements(col.settings->'options') AS opt
  WHERE opt.value->>'id' = NEW.value::text
  LIMIT 1;

  IF status_name = 'Done' THEN
    FOR member_rec IN
      SELECT user_id FROM public.workspace_members WHERE workspace_id = ws_id
    LOOP
      INSERT INTO public.notifications (user_id, message, read, source_type)
      VALUES (
        member_rec.user_id,
        'Item "' || item_title || '" was marked as Done',
        false,
        'automation'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS item_value_automation_trigger ON public.item_values;
CREATE TRIGGER item_value_automation_trigger
  AFTER INSERT OR UPDATE ON public.item_values
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_item_value_change();

-- Automation builder table already created in 0002; add default Done automation for existing boards
INSERT INTO public.automations (board_id, name, trigger, conditions, actions, is_active)
SELECT b.id, 'Notify when done', 'status_changed', '[{"column_type":"status","status_name":"Done"}]'::jsonb, '[{"type":"notify","message":"Item marked as Done"}]'::jsonb, true
FROM public.boards b
WHERE b.archived_at IS NULL
ON CONFLICT DO NOTHING;
