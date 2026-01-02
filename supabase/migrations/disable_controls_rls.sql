-- ===================================================================
-- Disable RLS for controls tables (global configuration data)
-- ===================================================================
-- Controls and control_template_links are global configuration
-- that should be accessible to all users without restrictions.
-- ===================================================================

-- Drop any existing policies first
DO $$
BEGIN
    -- Drop policies on controls table
    DROP POLICY IF EXISTS "Authenticated users can view controls" ON controls;
    DROP POLICY IF EXISTS "Authenticated users can insert controls" ON controls;
    DROP POLICY IF EXISTS "Authenticated users can update controls" ON controls;
    DROP POLICY IF EXISTS "Authenticated users can delete controls" ON controls;
    DROP POLICY IF EXISTS "Authenticated users can manage controls" ON controls;

    -- Drop policies on control_template_links table
    DROP POLICY IF EXISTS "Authenticated users can view template links" ON control_template_links;
    DROP POLICY IF EXISTS "Authenticated users can insert template links" ON control_template_links;
    DROP POLICY IF EXISTS "Authenticated users can update template links" ON control_template_links;
    DROP POLICY IF EXISTS "Authenticated users can delete template links" ON control_template_links;
    DROP POLICY IF EXISTS "Authenticated users can manage template links" ON control_template_links;
END $$;

-- Disable RLS on controls table
ALTER TABLE controls DISABLE ROW LEVEL SECURITY;

-- Disable RLS on control_template_links table
ALTER TABLE control_template_links DISABLE ROW LEVEL SECURITY;

-- Grant public access (for anon and authenticated roles)
GRANT ALL ON controls TO anon, authenticated;
GRANT ALL ON control_template_links TO anon, authenticated;

-- Verification
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('controls', 'control_template_links')
ORDER BY tablename;

-- Should show:
-- controls               | f (false - RLS disabled)
-- control_template_links | f (false - RLS disabled)
