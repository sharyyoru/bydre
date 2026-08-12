-- Fix Sales Intelligence Schema Issues
-- Adds missing unique constraints and fixes RLS policies
-- All operations check if tables/constraints exist before modifying

-- ============================================================================
-- 1. Add missing unique constraint on sales_opportunities (if table exists)
-- Required for upsert operations in ai-advisor.ts
-- ============================================================================
DO $$
BEGIN
  -- Only add constraint if table exists and constraint doesn't
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_opportunities' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'sales_opportunities_workspace_project_computed_key'
    ) THEN
      ALTER TABLE sales_opportunities 
        ADD CONSTRAINT sales_opportunities_workspace_project_computed_key 
        UNIQUE (workspace_id, project_name, computed_at);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. Add missing unique index on inventory_snapshots for project_id (if table exists)
-- The existing constraint uses project_name, but code also upserts by project_id
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_snapshots' AND table_schema = 'public') THEN
    -- Create partial unique index for when project_id is not null
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_snapshots_workspace_project_id_date') THEN
      CREATE UNIQUE INDEX idx_inventory_snapshots_workspace_project_id_date 
        ON inventory_snapshots(workspace_id, project_id, snapshot_date) 
        WHERE project_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 3. Fix RLS policies to include 'owner' role alongside 'admin' (if tables exist)
-- ============================================================================
DO $$
BEGIN
  -- developer_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'developer_profiles' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Admins can manage developer profiles" ON developer_profiles;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developer_profiles' AND policyname = 'Admins and owners can manage developer profiles') THEN
      CREATE POLICY "Admins and owners can manage developer profiles"
        ON developer_profiles FOR ALL
        USING (workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ));
    END IF;
  END IF;

  -- project_commissions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_commissions' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Admins can manage commissions" ON project_commissions;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_commissions' AND policyname = 'Admins and owners can manage commissions') THEN
      CREATE POLICY "Admins and owners can manage commissions"
        ON project_commissions FOR ALL
        USING (workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        ));
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 4. Add service role policies for tables that might be missing them
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_snapshots' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'inventory_snapshots' 
      AND policyname = 'Service role full access to inventory_snapshots'
    ) THEN
      CREATE POLICY "Service role full access to inventory_snapshots"
        ON inventory_snapshots FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 5. Create index for faster opportunity lookups (if table exists)
-- Note: Can't use partial index with now() as it's not immutable
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_opportunities' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_opportunities_workspace_valid') THEN
      CREATE INDEX idx_sales_opportunities_workspace_valid 
        ON sales_opportunities(workspace_id, valid_until DESC);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 6. Add missing columns to geniemap_projects if they don't exist
-- These are needed for Sales Brain integration
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geniemap_projects' AND table_schema = 'public') THEN
    -- Add images array if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'images'
    ) THEN
      ALTER TABLE geniemap_projects ADD COLUMN images text[] DEFAULT '{}';
    END IF;

    -- Add documents array if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'documents'
    ) THEN
      ALTER TABLE geniemap_projects ADD COLUMN documents text[] DEFAULT '{}';
    END IF;

    -- Add description if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'description'
    ) THEN
      ALTER TABLE geniemap_projects ADD COLUMN description text;
    END IF;

    -- Add amenities array if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'amenities'
    ) THEN
      ALTER TABLE geniemap_projects ADD COLUMN amenities text[] DEFAULT '{}';
    END IF;

    -- Add payment_plans jsonb if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'geniemap_projects' AND column_name = 'payment_plans'
    ) THEN
      ALTER TABLE geniemap_projects ADD COLUMN payment_plans jsonb DEFAULT '[]';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 7. Grant permissions on geniemap_projects (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geniemap_projects' AND table_schema = 'public') THEN
    GRANT ALL ON geniemap_projects TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 8. Add service role policies for global sentiment tables (if they exist)
-- These are missing from migration 0035
-- ============================================================================
DO $$
BEGIN
  -- global_investment_sentiment
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_investment_sentiment' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'global_investment_sentiment' 
      AND policyname = 'Service role full access to global_investment_sentiment'
    ) THEN
      CREATE POLICY "Service role full access to global_investment_sentiment"
        ON global_investment_sentiment FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;

  -- crypto_property_sentiment
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_property_sentiment' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'crypto_property_sentiment' 
      AND policyname = 'Service role full access to crypto_property_sentiment'
    ) THEN
      CREATE POLICY "Service role full access to crypto_property_sentiment"
        ON crypto_property_sentiment FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;
