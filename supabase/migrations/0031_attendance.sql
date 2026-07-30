-- Attendance System (Zoho People-style)
-- Workspace-scoped: members manage their own attendance/leave; admins manage all + config.
-- Reuses social_monitor_set_updated_at() and is_workspace_member/is_workspace_admin helpers.

-- ============================================================================
-- Tables
-- ============================================================================

-- Org-wide shift + capture settings (one row per workspace)
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Asia/Dubai',
  work_start time NOT NULL DEFAULT '09:00',
  work_end time NOT NULL DEFAULT '18:00',
  grace_minutes int NOT NULL DEFAULT 15,
  full_day_minutes int NOT NULL DEFAULT 480,
  half_day_minutes int NOT NULL DEFAULT 240,
  weekend_days int[] NOT NULL DEFAULT '{5,6}',      -- 0=Sun .. 6=Sat; default Fri/Sat
  require_selfie boolean NOT NULL DEFAULT true,
  capture_geo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One attendance record per user per day
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  check_in_at timestamptz,
  check_out_at timestamptz,
  break_minutes int NOT NULL DEFAULT 0,
  break_started_at timestamptz,
  worked_minutes int,
  status text NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'late', 'half_day', 'on_leave', 'holiday', 'weekend')),
  check_in_lat numeric,
  check_in_lng numeric,
  check_out_lat numeric,
  check_out_lng numeric,
  check_in_photo_path text,
  check_out_photo_path text,
  is_regularized boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, work_date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_records_ws_date ON public.attendance_records(workspace_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user ON public.attendance_records(workspace_id, user_id, work_date DESC);

-- Configurable leave categories
CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  color text NOT NULL DEFAULT '#0A1628',
  annual_quota numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, code)
);
CREATE INDEX IF NOT EXISTS idx_leave_types_ws ON public.leave_types(workspace_id, position);

-- Leave requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  day_portion text NOT NULL DEFAULT 'full' CHECK (day_portion IN ('full', 'first_half', 'second_half')),
  days numeric NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_ws ON public.leave_requests(workspace_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(workspace_id, user_id, start_date DESC);

-- Manual balance adjustments / opening balances (admin)
CREATE TABLE IF NOT EXISTS public.leave_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  days numeric NOT NULL,
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leave_adjustments_user ON public.leave_adjustments(workspace_id, user_id, leave_type_id);

-- Company holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  holiday_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, holiday_date)
);
CREATE INDEX IF NOT EXISTS idx_holidays_ws ON public.holidays(workspace_id, holiday_date);

-- ============================================================================
-- updated_at triggers (reuse existing function)
-- ============================================================================
DROP TRIGGER IF EXISTS trg_attendance_settings_updated_at ON public.attendance_settings;
CREATE TRIGGER trg_attendance_settings_updated_at
  BEFORE UPDATE ON public.attendance_settings
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

DROP TRIGGER IF EXISTS trg_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

DROP TRIGGER IF EXISTS trg_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.social_monitor_set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- attendance_settings: members read, admins manage
DROP POLICY IF EXISTS "att_settings_read" ON public.attendance_settings;
CREATE POLICY "att_settings_read" ON public.attendance_settings FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "att_settings_manage" ON public.attendance_settings;
CREATE POLICY "att_settings_manage" ON public.attendance_settings FOR ALL
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));

-- attendance_records: member owns own; admins all
DROP POLICY IF EXISTS "att_records_select" ON public.attendance_records;
CREATE POLICY "att_records_select" ON public.attendance_records FOR SELECT
  USING (public.is_workspace_admin(workspace_id) OR (public.is_workspace_member(workspace_id) AND user_id = auth.uid()));
DROP POLICY IF EXISTS "att_records_insert" ON public.attendance_records;
CREATE POLICY "att_records_insert" ON public.attendance_records FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id) OR (public.is_workspace_member(workspace_id) AND user_id = auth.uid()));
DROP POLICY IF EXISTS "att_records_update" ON public.attendance_records;
CREATE POLICY "att_records_update" ON public.attendance_records FOR UPDATE
  USING (public.is_workspace_admin(workspace_id) OR (public.is_workspace_member(workspace_id) AND user_id = auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id) OR (public.is_workspace_member(workspace_id) AND user_id = auth.uid()));
DROP POLICY IF EXISTS "att_records_delete" ON public.attendance_records;
CREATE POLICY "att_records_delete" ON public.attendance_records FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

-- leave_types: members read, admins manage
DROP POLICY IF EXISTS "leave_types_read" ON public.leave_types;
CREATE POLICY "leave_types_read" ON public.leave_types FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "leave_types_manage" ON public.leave_types;
CREATE POLICY "leave_types_manage" ON public.leave_types FOR ALL
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));

-- leave_requests: member owns own (update only while pending); admins all
DROP POLICY IF EXISTS "leave_req_select" ON public.leave_requests;
CREATE POLICY "leave_req_select" ON public.leave_requests FOR SELECT
  USING (public.is_workspace_admin(workspace_id) OR (public.is_workspace_member(workspace_id) AND user_id = auth.uid()));
DROP POLICY IF EXISTS "leave_req_insert" ON public.leave_requests;
CREATE POLICY "leave_req_insert" ON public.leave_requests FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id) AND user_id = auth.uid());
DROP POLICY IF EXISTS "leave_req_update_admin" ON public.leave_requests;
CREATE POLICY "leave_req_update_admin" ON public.leave_requests FOR UPDATE
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));
DROP POLICY IF EXISTS "leave_req_update_owner" ON public.leave_requests;
CREATE POLICY "leave_req_update_owner" ON public.leave_requests FOR UPDATE
  USING (public.is_workspace_member(workspace_id) AND user_id = auth.uid() AND status = 'pending')
  WITH CHECK (public.is_workspace_member(workspace_id) AND user_id = auth.uid());

-- leave_adjustments: members read own, admins manage
DROP POLICY IF EXISTS "leave_adj_select" ON public.leave_adjustments;
CREATE POLICY "leave_adj_select" ON public.leave_adjustments FOR SELECT
  USING (public.is_workspace_admin(workspace_id) OR (public.is_workspace_member(workspace_id) AND user_id = auth.uid()));
DROP POLICY IF EXISTS "leave_adj_manage" ON public.leave_adjustments;
CREATE POLICY "leave_adj_manage" ON public.leave_adjustments FOR ALL
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));

-- holidays: members read, admins manage
DROP POLICY IF EXISTS "holidays_read" ON public.holidays;
CREATE POLICY "holidays_read" ON public.holidays FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "holidays_manage" ON public.holidays;
CREATE POLICY "holidays_manage" ON public.holidays FOR ALL
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));

GRANT ALL ON public.attendance_settings TO authenticated;
GRANT ALL ON public.attendance_records TO authenticated;
GRANT ALL ON public.leave_types TO authenticated;
GRANT ALL ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_adjustments TO authenticated;
GRANT ALL ON public.holidays TO authenticated;

-- ============================================================================
-- Storage bucket for check-in selfies (private)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-selfies', 'attendance-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Objects are keyed as {workspace_id}/{user_id}/{file}. Uploads/reads are done
-- server-side with the service role, but we still scope authenticated access:
DROP POLICY IF EXISTS "att_selfies_read" ON storage.objects;
CREATE POLICY "att_selfies_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attendance-selfies'
    AND public.is_workspace_member((split_part(name, '/', 1))::uuid)
  );
DROP POLICY IF EXISTS "att_selfies_write" ON storage.objects;
CREATE POLICY "att_selfies_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attendance-selfies'
    AND (split_part(name, '/', 2))::uuid = auth.uid()
    AND public.is_workspace_member((split_part(name, '/', 1))::uuid)
  );

-- ============================================================================
-- Seed defaults for existing workspaces
-- ============================================================================
INSERT INTO public.attendance_settings (workspace_id)
SELECT id FROM public.workspaces
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO public.leave_types (workspace_id, name, code, color, annual_quota, paid, position)
SELECT w.id, t.name, t.code, t.color, t.quota, t.paid, t.pos
FROM public.workspaces w
CROSS JOIN (VALUES
  ('Annual Leave', 'annual', '#0A9D58', 21, true, 0),
  ('Sick Leave', 'sick', '#E4572E', 10, true, 1),
  ('Unpaid Leave', 'unpaid', '#6B7280', 0, false, 2)
) AS t(name, code, color, quota, paid, pos)
ON CONFLICT (workspace_id, code) DO NOTHING;
