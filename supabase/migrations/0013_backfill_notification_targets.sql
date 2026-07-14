UPDATE public.notifications n
SET item_id = c.item_id,
    board_id = i.board_id
FROM public.comments c
JOIN public.items i ON i.id = c.item_id
WHERE n.type = 'mention'
  AND n.source_id = c.id
  AND (n.item_id IS NULL OR n.board_id IS NULL);

UPDATE public.notifications n
SET item_id = i.id,
    board_id = i.board_id
FROM public.items i
WHERE n.type = 'assignment'
  AND n.source_id = i.id
  AND (n.item_id IS NULL OR n.board_id IS NULL);

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  mention_match text[];
  mentioned_user_id uuid;
  item_title text;
  item_board_id uuid;
BEGIN
  SELECT title, board_id INTO item_title, item_board_id FROM public.items WHERE id = NEW.item_id;

  FOR mention_match IN
    SELECT regexp_matches(NEW.content, '@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)', 'g')
  LOOP
    mentioned_user_id := mention_match[2]::uuid;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = mentioned_user_id) THEN
      INSERT INTO public.mentions (comment_id, mentioned_user_id)
      VALUES (NEW.id, mentioned_user_id)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.notifications (user_id, type, source_id, message, board_id, item_id, metadata)
      VALUES (
        mentioned_user_id,
        'mention',
        NEW.id,
        'You were mentioned in a comment on "' || COALESCE(item_title, 'item') || '"',
        item_board_id,
        NEW.item_id,
        '{"kind":"mention"}'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
