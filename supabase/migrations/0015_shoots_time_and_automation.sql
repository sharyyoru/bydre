-- Add Shoot Time column to Shoots board
INSERT INTO public.columns (board_id, name, type, position, settings)
SELECT b.id, 'Shoot Time', 'date', 11, '{"include_time": true}'::jsonb
FROM public.boards b
WHERE b.name = 'Shoots' AND b.archived_at IS NULL
ON CONFLICT (board_id, name) DO UPDATE SET
  type = EXCLUDED.type,
  position = EXCLUDED.position,
  settings = EXCLUDED.settings;

-- Add "Copied to Shoots" checkbox column to Content Calendar board
INSERT INTO public.columns (board_id, name, type, position, settings)
SELECT b.id, 'Copied to Shoots', 'checkbox', 11, '{}'::jsonb
FROM public.boards b
WHERE b.name = 'Content Calendar' AND b.archived_at IS NULL
ON CONFLICT (board_id, name) DO UPDATE SET
  type = EXCLUDED.type,
  position = EXCLUDED.position,
  settings = EXCLUDED.settings;

-- Function to auto-copy approved Content Calendar items to Shoots
CREATE OR REPLACE FUNCTION public.auto_copy_approved_to_shoots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_column public.columns%ROWTYPE;
  content_board_id uuid;
  shoots_board_id uuid;
  shoots_group_id uuid;
  item_row public.items%ROWTYPE;
  copied_flag_column_id uuid;
  already_copied boolean;
  new_item_id uuid;
  shoot_time_column_id uuid;
  publish_date_column_id uuid;
  status_column_id uuid;
  approval_column_id uuid;
  todo_status_id text;
  publish_date_value text;
  shoot_datetime text;
  assignee_record record;
BEGIN
  -- Check if this is an Approval column on Content Calendar board
  SELECT c.* INTO approval_column
  FROM public.columns c
  JOIN public.boards b ON b.id = c.board_id
  WHERE c.id = NEW.column_id 
    AND c.name = 'Approval' 
    AND b.name = 'Content Calendar'
    AND b.archived_at IS NULL;
  
  IF approval_column.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the Content Calendar board ID
  SELECT b.id INTO content_board_id
  FROM public.boards b
  WHERE b.name = 'Content Calendar' AND b.archived_at IS NULL;

  -- Check if value is "approval-approved"
  IF NEW.value #>> '{}' != 'approval-approved' THEN
    RETURN NEW;
  END IF;

  -- Get the item
  SELECT * INTO item_row FROM public.items WHERE id = NEW.item_id;
  
  -- Check if already copied
  SELECT c.id INTO copied_flag_column_id
  FROM public.columns c
  WHERE c.board_id = content_board_id 
    AND c.name = 'Copied to Shoots'
    AND c.archived_at IS NULL;
  
  IF copied_flag_column_id IS NOT NULL THEN
    SELECT COALESCE((value #>> '{}')::boolean, false) INTO already_copied
    FROM public.item_values
    WHERE item_id = NEW.item_id AND column_id = copied_flag_column_id;
    
    IF already_copied THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Get Shoots board and default group
  SELECT id INTO shoots_board_id
  FROM public.boards
  WHERE name = 'Shoots' AND archived_at IS NULL
  LIMIT 1;
  
  IF shoots_board_id IS NULL THEN
    RAISE NOTICE 'Shoots board not found';
    RETURN NEW;
  END IF;

  SELECT id INTO shoots_group_id
  FROM public.groups
  WHERE board_id = shoots_board_id AND archived_at IS NULL
  ORDER BY position ASC
  LIMIT 1;
  
  IF shoots_group_id IS NULL THEN
    RAISE NOTICE 'No group found on Shoots board';
    RETURN NEW;
  END IF;

  -- Create new item on Shoots board
  INSERT INTO public.items (
    title, description, board_id, group_id, type, priority, 
    position, created_by, parent_id
  ) VALUES (
    item_row.title,
    item_row.description,
    shoots_board_id,
    shoots_group_id,
    item_row.type,
    item_row.priority,
    0,
    item_row.created_by,
    NULL
  ) RETURNING id INTO new_item_id;

  -- Copy assignees
  FOR assignee_record IN 
    SELECT user_id FROM public.item_assignees WHERE item_id = item_row.id
  LOOP
    INSERT INTO public.item_assignees (item_id, user_id)
    VALUES (new_item_id, assignee_record.user_id)
    ON CONFLICT (item_id, user_id) DO NOTHING;
  END LOOP;

  -- Get column IDs for mapping
  SELECT id INTO shoot_time_column_id
  FROM public.columns
  WHERE board_id = shoots_board_id AND name = 'Shoot Time' AND archived_at IS NULL;

  SELECT id INTO publish_date_column_id
  FROM public.columns
  WHERE board_id = content_board_id AND name = 'Publish Date' AND archived_at IS NULL;

  SELECT id INTO status_column_id
  FROM public.columns
  WHERE board_id = shoots_board_id AND type = 'status' AND archived_at IS NULL
  LIMIT 1;

  SELECT id INTO approval_column_id
  FROM public.columns
  WHERE board_id = shoots_board_id AND name = 'Approval' AND archived_at IS NULL;

  -- Map Publish Date to Shoot Time with 9 AM default
  IF shoot_time_column_id IS NOT NULL AND publish_date_column_id IS NOT NULL THEN
    SELECT value #>> '{}' INTO publish_date_value
    FROM public.item_values
    WHERE item_id = item_row.id AND column_id = publish_date_column_id;
    
    IF publish_date_value IS NOT NULL THEN
      shoot_datetime := publish_date_value || 'T09:00:00';
      INSERT INTO public.item_values (item_id, column_id, value)
      VALUES (new_item_id, shoot_time_column_id, to_jsonb(shoot_datetime));
    END IF;
  END IF;

  -- Set Status to "To Do"
  IF status_column_id IS NOT NULL THEN
    SELECT (settings->'options'->0->>'id') INTO todo_status_id
    FROM public.columns
    WHERE id = status_column_id;
    
    IF todo_status_id IS NOT NULL THEN
      INSERT INTO public.item_values (item_id, column_id, value)
      VALUES (new_item_id, status_column_id, to_jsonb(todo_status_id));
    END IF;
  END IF;

  -- Set Approval to "Not requested"
  IF approval_column_id IS NOT NULL THEN
    INSERT INTO public.item_values (item_id, column_id, value)
    VALUES (new_item_id, approval_column_id, to_jsonb('approval-not-requested'));
  END IF;

  -- Copy other matching column values (by name and type)
  INSERT INTO public.item_values (item_id, column_id, value)
  SELECT new_item_id, shoots_col.id, orig_val.value
  FROM public.item_values orig_val
  JOIN public.columns content_col ON content_col.id = orig_val.column_id
  JOIN public.columns shoots_col ON 
    shoots_col.board_id = shoots_board_id AND
    shoots_col.name = content_col.name AND
    shoots_col.type = content_col.type AND
    shoots_col.archived_at IS NULL
  WHERE orig_val.item_id = item_row.id
    AND content_col.board_id = content_board_id
    AND content_col.name NOT IN ('Approval', 'Status', 'Publish Date')
    AND shoots_col.id NOT IN (shoot_time_column_id, status_column_id, approval_column_id)
  ON CONFLICT (item_id, column_id) DO NOTHING;

  -- Mark original as copied
  IF copied_flag_column_id IS NOT NULL THEN
    INSERT INTO public.item_values (item_id, column_id, value)
    VALUES (NEW.item_id, copied_flag_column_id, to_jsonb(true))
    ON CONFLICT (item_id, column_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Create notification for assignees
  FOR assignee_record IN 
    SELECT user_id FROM public.item_assignees WHERE item_id = item_row.id
  LOOP
    INSERT INTO public.notifications (user_id, type, source_id, message, board_id, item_id, metadata)
    VALUES (
      assignee_record.user_id,
      'assignment',
      new_item_id,
      'Your approved content "' || item_row.title || '" was scheduled for a shoot',
      shoots_board_id,
      new_item_id,
      jsonb_build_object('kind', 'auto_copied_to_shoots', 'original_item_id', item_row.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS auto_copy_approved_trigger ON public.item_values;
CREATE TRIGGER auto_copy_approved_trigger 
  AFTER INSERT OR UPDATE ON public.item_values 
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_copy_approved_to_shoots();
