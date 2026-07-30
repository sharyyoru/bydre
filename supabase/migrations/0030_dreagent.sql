-- DreAgent — Gemini-style chat tool
-- Shared per workspace: all members can view and manage conversations/messages.
-- Reuses social_monitor_set_updated_at() for conversation updated_at bumps.

CREATE TABLE IF NOT EXISTS public.dreagent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'New chat',
  model text NOT NULL DEFAULT 'gemini-2.0-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dreagent_conversations_workspace
  ON public.dreagent_conversations(workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.dreagent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.dreagent_conversations(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'model')),
  content text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dreagent_messages_conversation
  ON public.dreagent_messages(conversation_id, created_at);

DROP TRIGGER IF EXISTS trg_dreagent_conversations_updated_at ON public.dreagent_conversations;
CREATE TRIGGER trg_dreagent_conversations_updated_at
  BEFORE UPDATE ON public.dreagent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

ALTER TABLE public.dreagent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreagent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage dreagent conversations" ON public.dreagent_conversations;
CREATE POLICY "Members manage dreagent conversations" ON public.dreagent_conversations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = dreagent_conversations.workspace_id AND wm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Members manage dreagent messages" ON public.dreagent_messages;
CREATE POLICY "Members manage dreagent messages" ON public.dreagent_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = dreagent_messages.workspace_id AND wm.user_id = auth.uid())
);

GRANT ALL ON public.dreagent_conversations TO authenticated;
GRANT ALL ON public.dreagent_messages TO authenticated;
