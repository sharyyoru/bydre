-- Seed default workspace, templates, boards, columns, groups, and views.
-- Run after the test user exists and the handle_new_user trigger has created their profile.

DO $$
DECLARE
  ws_id uuid;
  admin_user_id uuid;
  board_shoots uuid;
  board_content uuid;
  board_tasks uuid;
  tmpl_shoots uuid;
  tmpl_content uuid;
  tmpl_tasks uuid;
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

  -- Templates
  INSERT INTO public.templates (name, description, type, config, is_default) VALUES
    ('Shoots', 'Video shoot planning with locations, crew, and approvals.', 'shoots', '{}', true)
  ON CONFLICT (name, type) DO UPDATE SET
    description = EXCLUDED.description,
    config = EXCLUDED.config,
    is_default = EXCLUDED.is_default
  RETURNING id INTO tmpl_shoots;

  INSERT INTO public.templates (name, description, type, config, is_default) VALUES
    ('Content Calendar', 'Content ideas, platforms, and publish schedule.', 'content', '{}', true)
  ON CONFLICT (name, type) DO UPDATE SET
    description = EXCLUDED.description,
    config = EXCLUDED.config,
    is_default = EXCLUDED.is_default
  RETURNING id INTO tmpl_content;

  INSERT INTO public.templates (name, description, type, config, is_default) VALUES
    ('Tasks', 'General task and sprint management.', 'tasks', '{}', true)
  ON CONFLICT (name, type) DO UPDATE SET
    description = EXCLUDED.description,
    config = EXCLUDED.config,
    is_default = EXCLUDED.is_default
  RETURNING id INTO tmpl_tasks;

  -- Boards
  INSERT INTO public.boards (workspace_id, template_id, name, type, position, default_view)
  VALUES (ws_id, tmpl_shoots, 'Shoots', 'shoots', 0, 'table')
  ON CONFLICT (workspace_id, name, type) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    position = EXCLUDED.position,
    default_view = EXCLUDED.default_view
  RETURNING id INTO board_shoots;

  INSERT INTO public.boards (workspace_id, template_id, name, type, position, default_view)
  VALUES (ws_id, tmpl_content, 'Content Calendar', 'content', 1, 'table')
  ON CONFLICT (workspace_id, name, type) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    position = EXCLUDED.position,
    default_view = EXCLUDED.default_view
  RETURNING id INTO board_content;

  INSERT INTO public.boards (workspace_id, template_id, name, type, position, default_view)
  VALUES (ws_id, tmpl_tasks, 'Tasks', 'tasks', 2, 'table')
  ON CONFLICT (workspace_id, name, type) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    position = EXCLUDED.position,
    default_view = EXCLUDED.default_view
  RETURNING id INTO board_tasks;

  -- Default columns and statuses for each board
  PERFORM public.create_default_columns(board_shoots);
  PERFORM public.create_default_columns(board_content);
  PERFORM public.create_default_columns(board_tasks);

  -- Board-specific extra columns
  -- Shoots: Location, Crew, Equipment, Budget
  INSERT INTO public.columns (board_id, name, type, position, settings) VALUES
    (board_shoots, 'Location', 'text', 7, '{}'),
    (board_shoots, 'Crew', 'dropdown', 8, '{"options": [{"id":"crew-small","name":"Small","color":"#6B7280"},{"id":"crew-medium","name":"Medium","color":"#3B82F6"},{"id":"crew-large","name":"Large","color":"#D4AF37"}]}'),
    (board_shoots, 'Equipment', 'text', 9, '{}'),
    (board_shoots, 'Budget', 'currency', 10, '{"currency":"USD","precision":2}')
  ON CONFLICT (board_id, name) DO UPDATE SET
    type = EXCLUDED.type,
    position = EXCLUDED.position,
    settings = EXCLUDED.settings;

  -- Content Calendar: Platform, Publish Date, Asset URL, Hashtags
  INSERT INTO public.columns (board_id, name, type, position, settings) VALUES
    (board_content, 'Platform', 'dropdown', 7, '{"options": [{"id":"platform-instagram","name":"Instagram","color":"#E1306C"},{"id":"platform-tiktok","name":"TikTok","color":"#000000"},{"id":"platform-youtube","name":"YouTube","color":"#FF0000"},{"id":"platform-linkedin","name":"LinkedIn","color":"#0A66C2"}]}'),
    (board_content, 'Publish Date', 'date', 8, '{"include_time": false}'),
    (board_content, 'Asset URL', 'url', 9, '{}'),
    (board_content, 'Hashtags', 'text', 10, '{}')
  ON CONFLICT (board_id, name) DO UPDATE SET
    type = EXCLUDED.type,
    position = EXCLUDED.position,
    settings = EXCLUDED.settings;

  -- Tasks: Sprint Points, Tags, Department
  INSERT INTO public.columns (board_id, name, type, position, settings) VALUES
    (board_tasks, 'Sprint Points', 'number', 7, '{"min":0,"max":100}'),
    (board_tasks, 'Tags', 'label', 8, '{"options": [{"id":"tag-urgent","name":"Urgent","color":"#EF4444"},{"id":"tag-bug","name":"Bug","color":"#F97316"},{"id":"tag-feature","name":"Feature","color":"#10B981"},{"id":"tag-design","name":"Design","color":"#8B5CF6"}]}'),
    (board_tasks, 'Department', 'dropdown', 9, '{"options": [{"id":"dept-marketing","name":"Marketing","color":"#3B82F6"},{"id":"dept-operations","name":"Operations","color":"#D4AF37"},{"id":"dept-creative","name":"Creative","color":"#EC4899"}]}')
  ON CONFLICT (board_id, name) DO UPDATE SET
    type = EXCLUDED.type,
    position = EXCLUDED.position,
    settings = EXCLUDED.settings;

  -- Default groups per board
  INSERT INTO public.groups (board_id, name, color, position) VALUES
    (board_shoots, 'Pre-Production', '#D4AF37', 0),
    (board_shoots, 'This Month', '#0A1628', 1),
    (board_shoots, 'Post-Production', '#6B7280', 2),
    (board_content, 'Ideas', '#D4AF37', 0),
    (board_content, 'Scheduled', '#0A1628', 1),
    (board_content, 'Published', '#10B981', 2),
    (board_tasks, 'Backlog', '#D4AF37', 0),
    (board_tasks, 'Sprint', '#0A1628', 1),
    (board_tasks, 'Done', '#10B981', 2)
  ON CONFLICT (board_id, name) DO UPDATE SET
    color = EXCLUDED.color,
    position = EXCLUDED.position;

  -- Default views per board
  INSERT INTO public.board_views (board_id, name, type, position, config) VALUES
    (board_shoots, 'Table', 'table', 0, '{}'),
    (board_shoots, 'Calendar', 'calendar', 1, '{"date_column":"Due Date"}'),
    (board_shoots, 'Kanban', 'kanban', 2, '{"group_by":"Status"}'),
    (board_content, 'Table', 'table', 0, '{}'),
    (board_content, 'Calendar', 'calendar', 1, '{"date_column":"Publish Date"}'),
    (board_content, 'Kanban', 'kanban', 2, '{"group_by":"Status"}'),
    (board_tasks, 'Table', 'table', 0, '{}'),
    (board_tasks, 'Calendar', 'calendar', 1, '{"date_column":"Due Date"}'),
    (board_tasks, 'Kanban', 'kanban', 2, '{"group_by":"Status"}'),
    (board_tasks, 'Workload', 'workload', 3, '{"people_column":"Owner"}')
  ON CONFLICT (board_id, type) DO NOTHING;
END $$;
