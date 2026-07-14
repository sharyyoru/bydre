ALTER TABLE public.activity_events
  DROP CONSTRAINT IF EXISTS activity_events_board_id_fkey;

ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_board_id_fkey
  FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.audit_board_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.record_activity(
    OLD.workspace_id,
    OLD.id,
    NULL,
    NULL,
    NULL,
    'board.deleted',
    'board',
    OLD.id,
    to_jsonb(OLD),
    NULL
  );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS boards_activity_delete_audit ON public.boards;
CREATE TRIGGER boards_activity_delete_audit
  BEFORE DELETE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.audit_board_delete();
