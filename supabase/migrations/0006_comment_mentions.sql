CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  mention_match text[];
  mentioned_user_id uuid;
  item_title text;
BEGIN
  SELECT title INTO item_title FROM public.items WHERE id = NEW.item_id;

  FOR mention_match IN
    SELECT regexp_matches(NEW.content, '@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)', 'g')
  LOOP
    mentioned_user_id := mention_match[2]::uuid;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = mentioned_user_id) THEN
      INSERT INTO public.mentions (comment_id, mentioned_user_id)
      VALUES (NEW.id, mentioned_user_id)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.notifications (user_id, type, source_id, message)
      VALUES (
        mentioned_user_id,
        'mention',
        NEW.id,
        'You were mentioned in a comment on "' || COALESCE(item_title, 'item') || '"'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
