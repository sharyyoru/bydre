-- Owner Sheets: Upload sessions and unified contacts
-- Migration: 0037_owner_sheets.sql

-- Upload batch tracking
CREATE TABLE IF NOT EXISTS owner_sheets_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  contact_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Unified owner contacts
CREATE TABLE IF NOT EXISTS owner_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  upload_batch_id UUID NOT NULL REFERENCES owner_sheets_uploads(id) ON DELETE CASCADE,
  
  -- Core contact fields
  name TEXT,
  phone TEXT,
  phone_normalized TEXT, -- For duplicate matching (digits only)
  email TEXT,
  email_normalized TEXT, -- For duplicate matching (lowercase, trimmed)
  
  -- Property details
  property TEXT,
  area TEXT,
  building TEXT,
  unit TEXT,
  
  -- Extended fields
  owner_type TEXT,
  nationality TEXT,
  language TEXT,
  notes TEXT,
  last_contact_date DATE,
  
  -- Source tracking
  source_file TEXT NOT NULL,
  source_folder TEXT,
  source_row INTEGER NOT NULL,
  
  -- Duplicate tracking
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of UUID REFERENCES owner_contacts(id),
  duplicate_reason TEXT, -- 'phone' or 'email'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_contacts_workspace ON owner_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_owner_contacts_batch ON owner_contacts(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_owner_contacts_phone ON owner_contacts(phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owner_contacts_email ON owner_contacts(email_normalized) WHERE email_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owner_contacts_area ON owner_contacts(area) WHERE area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owner_contacts_building ON owner_contacts(building) WHERE building IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owner_contacts_duplicates ON owner_contacts(is_duplicate) WHERE is_duplicate = true;

-- RLS Policies
ALTER TABLE owner_sheets_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_contacts ENABLE ROW LEVEL SECURITY;

-- Uploads: workspace members can view, admins can insert
CREATE POLICY "Workspace members can view uploads"
  ON owner_sheets_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_sheets_uploads.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert uploads"
  ON owner_sheets_uploads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_sheets_uploads.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can update uploads"
  ON owner_sheets_uploads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_sheets_uploads.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete uploads"
  ON owner_sheets_uploads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_sheets_uploads.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'admin'
    )
  );

-- Contacts: workspace members can view, admins can modify
CREATE POLICY "Workspace members can view contacts"
  ON owner_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert contacts"
  ON owner_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can update contacts"
  ON owner_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete contacts"
  ON owner_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = owner_contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'admin'
    )
  );
