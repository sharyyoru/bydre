---
description: Create a Supabase database migration
---

## Context
Database migrations live in `supabase/migrations/` and are applied in order. Each migration is a SQL file that modifies the schema.

## Naming Convention
```
NNNN_descriptive_name.sql
```
- `NNNN` = sequential number (e.g., 0044, 0045)
- `descriptive_name` = what the migration does (snake_case)

## Steps

### 1. Find the next migration number
// turbo
```bash
ls supabase/migrations/ | Sort-Object | Select-Object -Last 1
```

### 2. Create migration file
```sql
-- supabase/migrations/NNNN_description.sql

-- =============================================
-- Description: Brief description of changes
-- =============================================

-- Create new table
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Add columns here
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_table_name_workspace 
    ON table_name(workspace_id);
CREATE INDEX IF NOT EXISTS idx_table_name_status 
    ON table_name(status);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workspace data" ON table_name
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert in own workspace" ON table_name
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own workspace data" ON table_name
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own workspace data" ON table_name
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Apply migration (local)
```bash
npx supabase db push
```

### 4. Verify in Supabase Dashboard
1. Go to Supabase Dashboard → Database → Tables
2. Verify table exists with correct columns
3. Check RLS policies in Authentication → Policies

## Common Patterns

### Add Column to Existing Table
```sql
ALTER TABLE table_name 
    ADD COLUMN IF NOT EXISTS new_column TEXT;
```

### Add Foreign Key
```sql
ALTER TABLE child_table 
    ADD CONSTRAINT fk_parent 
    FOREIGN KEY (parent_id) 
    REFERENCES parent_table(id) 
    ON DELETE CASCADE;
```

### Create Enum Type
```sql
CREATE TYPE status_enum AS ENUM ('pending', 'active', 'completed', 'cancelled');

ALTER TABLE table_name 
    ADD COLUMN status status_enum DEFAULT 'pending';
```

### Add Check Constraint
```sql
ALTER TABLE table_name 
    ADD CONSTRAINT check_positive_amount 
    CHECK (amount >= 0);
```

### Create Junction Table (Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS table_a_table_b (
    table_a_id UUID REFERENCES table_a(id) ON DELETE CASCADE,
    table_b_id UUID REFERENCES table_b(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (table_a_id, table_b_id)
);
```

### Create View
```sql
CREATE OR REPLACE VIEW view_name AS
SELECT 
    t.id,
    t.name,
    COUNT(r.id) as related_count
FROM table_name t
LEFT JOIN related_table r ON r.table_id = t.id
GROUP BY t.id, t.name;
```

### Create Function
```sql
CREATE OR REPLACE FUNCTION calculate_total(item_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total NUMERIC;
BEGIN
    SELECT SUM(amount) INTO total
    FROM line_items
    WHERE parent_id = item_id;
    
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;
```

## Existing Tables Reference
Key tables in the system:
- `workspaces` - Workspace/tenant data
- `workspace_members` - User-workspace relationships
- `boards` - Board definitions
- `board_items` - Items/tasks
- `board_groups` - Groups within boards
- `notifications` - User notifications
- `integration_credentials` - API keys (Meta, GenieMap, etc.)

## Related
- `/api-route` - Create API to interact with new tables
- `/deploy-vercel` - Deploy after migration
