DROP POLICY IF EXISTS "workspace_member_groups" ON public.groups;

CREATE POLICY "workspace_member_groups_read" ON public.groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = groups.board_id
        AND public.is_workspace_member(b.workspace_id)
    )
  );

CREATE POLICY "workspace_member_groups_insert" ON public.groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = groups.board_id
        AND public.is_workspace_member(b.workspace_id)
    )
  );

CREATE POLICY "workspace_member_groups_update" ON public.groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = groups.board_id
        AND public.is_workspace_member(b.workspace_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = groups.board_id
        AND public.is_workspace_member(b.workspace_id)
    )
  );

CREATE POLICY "workspace_admin_groups_delete" ON public.groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = groups.board_id
        AND public.is_workspace_admin(b.workspace_id)
    )
  );
