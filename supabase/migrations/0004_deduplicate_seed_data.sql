WITH duplicate_boards AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY workspace_id, name, type
      ORDER BY created_at, id
    ) AS row_number
  FROM public.boards
  WHERE archived_at IS NULL
)
DELETE FROM public.boards
WHERE id IN (SELECT id FROM duplicate_boards WHERE row_number > 1);

WITH canonical_templates AS (
  SELECT id, name, type,
    first_value(id) OVER (
      PARTITION BY name, type
      ORDER BY created_at, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY name, type
      ORDER BY created_at, id
    ) AS row_number
  FROM public.templates
)
UPDATE public.boards b
SET template_id = canonical_templates.canonical_id
FROM canonical_templates
WHERE b.template_id = canonical_templates.id
  AND canonical_templates.id <> canonical_templates.canonical_id;

WITH duplicate_templates AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY name, type
      ORDER BY created_at, id
    ) AS row_number
  FROM public.templates
)
DELETE FROM public.templates
WHERE id IN (SELECT id FROM duplicate_templates WHERE row_number > 1);

WITH duplicate_columns AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY board_id, name
      ORDER BY created_at, id
    ) AS row_number
  FROM public.columns
  WHERE archived_at IS NULL
)
DELETE FROM public.columns
WHERE id IN (SELECT id FROM duplicate_columns WHERE row_number > 1);

WITH duplicate_groups AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY board_id, name
      ORDER BY created_at, id
    ) AS row_number
  FROM public.groups
  WHERE archived_at IS NULL
)
DELETE FROM public.groups
WHERE id IN (SELECT id FROM duplicate_groups WHERE row_number > 1);

WITH duplicate_statuses AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY board_id, name
      ORDER BY created_at, id
    ) AS row_number
  FROM public.statuses
)
DELETE FROM public.statuses
WHERE id IN (SELECT id FROM duplicate_statuses WHERE row_number > 1);

WITH duplicate_views AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY board_id, type
      ORDER BY created_at, id
    ) AS row_number
  FROM public.board_views
)
DELETE FROM public.board_views
WHERE id IN (SELECT id FROM duplicate_views WHERE row_number > 1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'templates_name_type_key'
      AND conrelid = 'public.templates'::regclass
  ) THEN
    ALTER TABLE public.templates
      ADD CONSTRAINT templates_name_type_key UNIQUE (name, type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'boards_workspace_name_type_key'
      AND conrelid = 'public.boards'::regclass
  ) THEN
    ALTER TABLE public.boards
      ADD CONSTRAINT boards_workspace_name_type_key UNIQUE (workspace_id, name, type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'columns_board_name_key'
      AND conrelid = 'public.columns'::regclass
  ) THEN
    ALTER TABLE public.columns
      ADD CONSTRAINT columns_board_name_key UNIQUE (board_id, name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'groups_board_name_key'
      AND conrelid = 'public.groups'::regclass
  ) THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_board_name_key UNIQUE (board_id, name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'statuses_board_name_key'
      AND conrelid = 'public.statuses'::regclass
  ) THEN
    ALTER TABLE public.statuses
      ADD CONSTRAINT statuses_board_name_key UNIQUE (board_id, name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'board_views_board_id_type_key'
      AND conrelid = 'public.board_views'::regclass
  ) THEN
    ALTER TABLE public.board_views
      ADD CONSTRAINT board_views_board_id_type_key UNIQUE (board_id, type);
  END IF;
END $$;
