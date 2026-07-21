-- Add a reusable "Tags" label (multi-select) column to every board.
-- Idempotent: skips boards that already have a Tags column.
INSERT INTO public.columns (board_id, name, type, position, settings)
SELECT
  b.id,
  'Tags',
  'label',
  COALESCE((SELECT MAX(c.position) + 1 FROM public.columns c WHERE c.board_id = b.id), 0),
  '{"options":[
    {"id":"tag-urgent","name":"Urgent","color":"#EF4444"},
    {"id":"tag-bug","name":"Bug","color":"#F59E0B"},
    {"id":"tag-feature","name":"Feature","color":"#10B981"},
    {"id":"tag-design","name":"Design","color":"#8B5CF6"}
  ]}'::jsonb
FROM public.boards b
WHERE b.archived_at IS NULL
ON CONFLICT (board_id, name) DO NOTHING;
