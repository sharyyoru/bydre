-- ByDre initial schema

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#0A1628',
  accent_color text NOT NULL DEFAULT '#D4AF37',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Workspace members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Boards
CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('shoots', 'content', 'tasks')),
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Statuses
CREATE TABLE IF NOT EXISTS public.statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Items
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('shoot', 'content', 'task')),
  status_id uuid REFERENCES public.statuses(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date date,
  due_date date,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Item assignees
CREATE TABLE IF NOT EXISTS public.item_assignees (
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mentions
CREATE TABLE IF NOT EXISTS public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention', 'assignment')),
  source_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper: is workspace member
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies are dropped before recreation so this migration can safely rerun.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT * FROM (VALUES
      ('profiles', 'Profiles readable by workspace members'),
      ('profiles', 'Profiles updatable by owner or admins'),
      ('workspaces', 'Workspaces readable by members'),
      ('workspaces', 'Workspaces updatable by admins'),
      ('workspace_members', 'Workspace members readable by members'),
      ('workspace_members', 'Workspace members manageable by admins'),
      ('boards', 'Boards readable by workspace members'),
      ('boards', 'Boards manageable by workspace members'),
      ('groups', 'Groups readable by board workspace members'),
      ('groups', 'Groups manageable by workspace members'),
      ('statuses', 'Statuses readable by board workspace members'),
      ('statuses', 'Statuses manageable by workspace members'),
      ('items', 'Items readable by board workspace members'),
      ('items', 'Items manageable by workspace members'),
      ('item_assignees', 'Item assignees readable by board workspace members'),
      ('item_assignees', 'Item assignees manageable by workspace members'),
      ('comments', 'Comments readable by board workspace members'),
      ('comments', 'Comments manageable by workspace members'),
      ('mentions', 'Mentions readable by involved users'),
      ('mentions', 'Mentions manageable by workspace members'),
      ('notifications', 'Notifications readable by owner'),
      ('notifications', 'Notifications updatable by owner')
    ) AS policies(table_name, policy_name)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policy_name, policy_record.table_name);
  END LOOP;
END $$;

-- Profiles policies
CREATE POLICY "Profiles readable by workspace members"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = id
      )
    )
  );

CREATE POLICY "Profiles updatable by owner or admins"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR role = 'admin')
  WITH CHECK (id = auth.uid() OR role = 'admin');

-- Workspaces policies
CREATE POLICY "Workspaces readable by members"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id));

CREATE POLICY "Workspaces updatable by admins"
  ON public.workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Workspace members policies
CREATE POLICY "Workspace members readable by members"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members manageable by admins"
  ON public.workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_members.workspace_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Boards policies
CREATE POLICY "Boards readable by workspace members"
  ON public.boards FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Boards manageable by workspace members"
  ON public.boards FOR ALL
  USING (public.is_workspace_member(workspace_id));

-- Groups policies
CREATE POLICY "Groups readable by board workspace members"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = groups.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Groups manageable by workspace members"
  ON public.groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = groups.board_id AND wm.user_id = auth.uid()
    )
  );

-- Statuses policies
CREATE POLICY "Statuses readable by board workspace members"
  ON public.statuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = statuses.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Statuses manageable by workspace members"
  ON public.statuses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = statuses.board_id AND wm.user_id = auth.uid()
    )
  );

-- Items policies
CREATE POLICY "Items readable by board workspace members"
  ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = items.board_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Items manageable by workspace members"
  ON public.items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE b.id = items.board_id AND wm.user_id = auth.uid()
    )
  );

-- Item assignees policies
CREATE POLICY "Item assignees readable by board workspace members"
  ON public.item_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON i.board_id = b.id
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE i.id = item_assignees.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Item assignees manageable by workspace members"
  ON public.item_assignees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON i.board_id = b.id
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE i.id = item_assignees.item_id AND wm.user_id = auth.uid()
    )
  );

-- Comments policies
CREATE POLICY "Comments readable by board workspace members"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON i.board_id = b.id
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE i.id = comments.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Comments manageable by workspace members"
  ON public.comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.boards b ON i.board_id = b.id
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE i.id = comments.item_id AND wm.user_id = auth.uid()
    )
  );

-- Mentions policies
CREATE POLICY "Mentions readable by involved users"
  ON public.mentions FOR SELECT
  USING (
    mentioned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.comments c
      WHERE c.id = mentions.comment_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Mentions manageable by workspace members"
  ON public.mentions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.items i ON c.item_id = i.id
      JOIN public.boards b ON i.board_id = b.id
      JOIN public.workspace_members wm ON b.workspace_id = wm.workspace_id
      WHERE c.id = mentions.comment_id AND wm.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Notifications readable by owner"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Notifications updatable by owner"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS trigger AS $$
DECLARE
  match text;
  mentioned_email text;
  mentioned_user_id uuid;
  item_title text;
BEGIN
  SELECT title INTO item_title FROM public.items WHERE id = new.item_id;

  FOR match IN
    SELECT (regexp_matches(new.content, '@([^\s]+)', 'g'))[1]
  LOOP
    mentioned_email := match;
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE email = mentioned_email;

    IF mentioned_user_id IS NOT NULL THEN
      INSERT INTO public.mentions (comment_id, mentioned_user_id)
      VALUES (new.id, mentioned_user_id)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.notifications (user_id, type, source_id, message)
      VALUES (
        mentioned_user_id,
        'mention',
        new.id,
        'You were mentioned in a comment on "' || COALESCE(item_title, 'item') || '"'
      );
    END IF;
  END LOOP;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
