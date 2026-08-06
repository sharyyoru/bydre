-- Data Deletion Requests Table
-- Required for Facebook/Meta App compliance
-- Stores user requests to delete their Instagram connection data

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  instagram_handle text,
  reason text,
  confirmation_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  data_found boolean,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for lookup by confirmation code
CREATE INDEX IF NOT EXISTS idx_deletion_requests_code ON public.data_deletion_requests(confirmation_code);

-- Index for lookup by email
CREATE INDEX IF NOT EXISTS idx_deletion_requests_email ON public.data_deletion_requests(email);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.data_deletion_requests(status);

-- No RLS - this is managed by service role only
-- The API endpoint uses service role key, not user auth

-- Grant access to authenticated users for admin viewing
GRANT SELECT ON public.data_deletion_requests TO authenticated;

-- Comment for documentation
COMMENT ON TABLE public.data_deletion_requests IS 'Stores data deletion requests from users for Facebook App compliance. Users can request deletion of their Instagram connection data.';
