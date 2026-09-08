-- Create public_leads table for lead capture
CREATE TABLE IF NOT EXISTS public_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT,
  lead_source TEXT DEFAULT 'website',
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_public_leads_email ON public_leads(email);
CREATE INDEX IF NOT EXISTS idx_public_leads_created_at ON public_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_leads_status ON public_leads(status);

-- Enable RLS
ALTER TABLE public_leads ENABLE ROW LEVEL SECURITY;

-- Policy for service role to insert (API route)
CREATE POLICY "Service role can insert leads" ON public_leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy for authenticated users to view leads
CREATE POLICY "Authenticated users can view leads" ON public_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to update leads
CREATE POLICY "Authenticated users can update leads" ON public_leads
  FOR UPDATE
  TO authenticated
  USING (true);
