-- Rename the "Tasks" board to "Graphics" (one-time rename)
UPDATE public.boards
SET name = 'Graphics'
WHERE name = 'Tasks';
