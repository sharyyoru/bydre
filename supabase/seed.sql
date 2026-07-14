-- Seed default workspace and boards.
-- Run after the test user exists and the handle_new_user trigger has created their profile.

DO $$
DECLARE
  ws_id uuid;
  admin_user_id uuid;
  board_shoots uuid;
  board_content uuid;
  board_tasks uuid;
  group_todo uuid;
  group_progress uuid;
  group_done uuid;
BEGIN
  SELECT id INTO admin_user_id FROM public.profiles WHERE email = 'wilson@drehomes.com' LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Test user profile not found; skipping seed.';
    RETURN;
  END IF;

  -- Workspace
  INSERT INTO public.workspaces (name, slug, primary_color, accent_color)
  VALUES ('DreHomes', 'drehomes', '#0A1628', '#D4AF37')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO ws_id;

  IF ws_id IS NULL THEN
    SELECT id INTO ws_id FROM public.workspaces WHERE slug = 'drehomes' LIMIT 1;
  END IF;

  -- Membership
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, admin_user_id, 'admin')
  ON CONFLICT DO NOTHING;

  -- Boards
  INSERT INTO public.boards (workspace_id, name, type, position)
  VALUES (ws_id, 'Shoots', 'shoots', 0)
  RETURNING id INTO board_shoots;

  INSERT INTO public.boards (workspace_id, name, type, position)
  VALUES (ws_id, 'Content Calendar', 'content', 1)
  RETURNING id INTO board_content;

  INSERT INTO public.boards (workspace_id, name, type, position)
  VALUES (ws_id, 'Tasks', 'tasks', 2)
  RETURNING id INTO board_tasks;

  -- Default statuses per board
  INSERT INTO public.statuses (board_id, name, color, position) VALUES
    (board_shoots, 'To Do', '#6B7280', 0),
    (board_shoots, 'In Progress', '#3B82F6', 1),
    (board_shoots, 'Done', '#10B981', 2),
    (board_content, 'To Do', '#6B7280', 0),
    (board_content, 'In Progress', '#3B82F6', 1),
    (board_content, 'Done', '#10B981', 2),
    (board_tasks, 'To Do', '#6B7280', 0),
    (board_tasks, 'In Progress', '#3B82F6', 1),
    (board_tasks, 'Done', '#10B981', 2);

  -- Default groups per board
  INSERT INTO public.groups (board_id, name, color, position) VALUES
    (board_shoots, 'Pre-Production', '#D4AF37', 0),
    (board_shoots, 'This Month', '#0A1628', 1),
    (board_content, 'Ideas', '#D4AF37', 0),
    (board_content, 'Scheduled', '#0A1628', 1),
    (board_tasks, 'Backlog', '#D4AF37', 0),
    (board_tasks, 'Sprint', '#0A1628', 1);
END $$;
