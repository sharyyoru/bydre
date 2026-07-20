-- Backfill: copy all currently-approved content items to the Shoots board
-- and create admin "assign shooter" notifications. Idempotent (skips duplicates by title).
DO $$
DECLARE
  content_board RECORD;
  approval_col_id uuid;
  approval_settings jsonb;
  approved_id text;
  shoots_board_id uuid;
  dest_group_id uuid;
  content_item RECORD;
  new_item_id uuid;
BEGIN
  FOR content_board IN
    SELECT id, workspace_id
    FROM public.boards
    WHERE type = 'content' AND archived_at IS NULL
  LOOP
    -- Find the Approval column on this content board
    SELECT id, settings
      INTO approval_col_id, approval_settings
    FROM public.columns
    WHERE board_id = content_board.id
      AND name = 'Approval'
      AND archived_at IS NULL
    LIMIT 1;

    IF approval_col_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Resolve the "Approved" option id from the column settings
    SELECT opt->>'id'
      INTO approved_id
    FROM jsonb_array_elements(COALESCE(approval_settings->'options', '[]'::jsonb)) AS opt
    WHERE lower(opt->>'name') = 'approved'
    LIMIT 1;

    IF approved_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Find the Shoots board in the same workspace
    SELECT id
      INTO shoots_board_id
    FROM public.boards
    WHERE workspace_id = content_board.workspace_id
      AND type = 'shoots'
      AND archived_at IS NULL
    LIMIT 1;

    IF shoots_board_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Ensure a destination group exists on the Shoots board
    SELECT id
      INTO dest_group_id
    FROM public.groups
    WHERE board_id = shoots_board_id
      AND archived_at IS NULL
    ORDER BY position ASC
    LIMIT 1;

    IF dest_group_id IS NULL THEN
      INSERT INTO public.groups (board_id, name, color, position)
      VALUES (shoots_board_id, 'Shoots', '#3B82F6', 0)
      RETURNING id INTO dest_group_id;
    END IF;

    -- Iterate all approved, top-level content items
    FOR content_item IN
      SELECT i.id, i.title, i.priority, i.created_by
      FROM public.items i
      JOIN public.item_values iv
        ON iv.item_id = i.id
       AND iv.column_id = approval_col_id
      WHERE i.board_id = content_board.id
        AND i.archived_at IS NULL
        AND i.parent_id IS NULL
        AND (
          iv.value = to_jsonb(approved_id)
          OR btrim(iv.value::text, '"') = approved_id
        )
    LOOP
      -- Skip if a shoot with the same title already exists
      IF EXISTS (
        SELECT 1 FROM public.items
        WHERE board_id = shoots_board_id
          AND title = content_item.title
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.items (board_id, group_id, title, type, priority, created_by, position)
      VALUES (shoots_board_id, dest_group_id, content_item.title, 'shoot', content_item.priority, content_item.created_by, 0)
      RETURNING id INTO new_item_id;

      INSERT INTO public.workflow_notifications (workspace_id, item_id, notification_type, status)
      VALUES (content_board.workspace_id, new_item_id, 'assign_shooter', 'pending')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
