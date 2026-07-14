UPDATE public.columns
SET settings = jsonb_set(COALESCE(settings, '{}'), '{multi_select}', 'true'::jsonb, true)
WHERE name = 'Platform'
  AND type = 'dropdown'
  AND archived_at IS NULL;
