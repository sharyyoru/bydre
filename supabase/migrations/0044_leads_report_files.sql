-- =============================================
-- Leads Report File Storage
-- =============================================

-- Table to track uploaded lead report files
CREATE TABLE IF NOT EXISTS lead_report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    sheet_count INTEGER DEFAULT 1,
    row_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE lead_report_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view workspace files" ON lead_report_files
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload to workspace" ON lead_report_files
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete workspace files" ON lead_report_files
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_report_files_workspace 
    ON lead_report_files(workspace_id);

-- Create storage bucket for lead files (run in Supabase dashboard if not exists)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('lead-reports', 'lead-reports', false)
-- ON CONFLICT DO NOTHING;
