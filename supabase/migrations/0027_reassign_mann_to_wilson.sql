-- Reassign everything owned by / related to Mann Chavan to Wilson Ali.
-- Mann Chavan was removed from the workspace; this transfers his work so nothing is orphaned.
-- Idempotent: safe to run once; resolves users by email.
DO $$
DECLARE
  mann uuid;
  wilson uuid;
BEGIN
  SELECT id INTO mann   FROM public.profiles WHERE email = 'mann@drehomes.com';
  SELECT id INTO wilson FROM public.profiles WHERE email = 'wilson@drehomes.com';

  IF wilson IS NULL THEN
    RAISE EXCEPTION 'Target user wilson@drehomes.com not found';
  END IF;
  IF mann IS NULL THEN
    RAISE NOTICE 'mann@drehomes.com not found; nothing to reassign';
    RETURN;
  END IF;

  -- Item assignees (PK item_id,user_id): drop rows where Wilson is already assigned, then reassign the rest.
  DELETE FROM public.item_assignees a
   WHERE a.user_id = mann
     AND EXISTS (SELECT 1 FROM public.item_assignees b WHERE b.item_id = a.item_id AND b.user_id = wilson);
  UPDATE public.item_assignees SET user_id = wilson WHERE user_id = mann;

  -- Task assignees (UNIQUE item_id,user_id,role).
  DELETE FROM public.task_assignees a
   WHERE a.user_id = mann
     AND EXISTS (SELECT 1 FROM public.task_assignees b WHERE b.item_id = a.item_id AND b.role = a.role AND b.user_id = wilson);
  UPDATE public.task_assignees SET user_id = wilson WHERE user_id = mann;

  -- Comments authored by Mann.
  UPDATE public.comments SET user_id = wilson WHERE user_id = mann;

  -- Mentions of Mann (avoid duplicate mention per comment).
  DELETE FROM public.mentions a
   WHERE a.mentioned_user_id = mann
     AND EXISTS (SELECT 1 FROM public.mentions b WHERE b.comment_id = a.comment_id AND b.mentioned_user_id = wilson);
  UPDATE public.mentions SET mentioned_user_id = wilson WHERE mentioned_user_id = mann;

  -- Rewrite Mann's id/name inside comment mention markup "@[Name](id)".
  UPDATE public.comments
     SET content = replace(replace(content, mann::text, wilson::text), 'Mann Chavan', 'Wilson Ali')
   WHERE content LIKE '%' || mann::text || '%' OR content LIKE '%Mann Chavan%';

  -- Items created/updated/last-touched by Mann.
  UPDATE public.items SET created_by       = wilson WHERE created_by       = mann;
  UPDATE public.items SET updated_by        = wilson WHERE updated_by        = mann;
  UPDATE public.items SET last_activity_by  = wilson WHERE last_activity_by  = mann;

  -- Activity history attribution.
  UPDATE public.activity_events SET actor_id = wilson WHERE actor_id = mann;

  -- Other attribution columns, guarded so missing tables don't break the migration.
  IF to_regclass('public.attachments') IS NOT NULL THEN
    UPDATE public.attachments SET uploaded_by = wilson WHERE uploaded_by = mann;
  END IF;
  IF to_regclass('public.automations') IS NOT NULL THEN
    UPDATE public.automations SET created_by = wilson WHERE created_by = mann;
  END IF;
  IF to_regclass('public.board_views') IS NOT NULL THEN
    UPDATE public.board_views SET created_by = wilson WHERE created_by = mann;
  END IF;
  IF to_regclass('public.import_runs') IS NOT NULL THEN
    UPDATE public.import_runs SET created_by = wilson WHERE created_by = mann;
  END IF;
  IF to_regclass('public.import_assignment_review') IS NOT NULL THEN
    UPDATE public.import_assignment_review SET suggested_user_id = wilson WHERE suggested_user_id = mann;
  END IF;

  -- Workspace membership: give Wilson Mann's memberships if missing, else drop Mann's duplicate.
  DELETE FROM public.workspace_members a
   WHERE a.user_id = mann
     AND EXISTS (SELECT 1 FROM public.workspace_members b WHERE b.workspace_id = a.workspace_id AND b.user_id = wilson);
  UPDATE public.workspace_members SET user_id = wilson WHERE user_id = mann;

  -- Personal, non-transferable state: remove Mann's rows.
  DELETE FROM public.notifications          WHERE user_id = mann;
  DELETE FROM public.board_filters          WHERE user_id = mann;
  DELETE FROM public.board_user_preferences WHERE user_id = mann;
END $$;
