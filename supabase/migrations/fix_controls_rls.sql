-- ===================================================================
-- Fix RLS policies for controls and control_template_links tables
-- ===================================================================
-- These tables contain global configuration that should be accessible
-- to all authenticated users.
-- ===================================================================

-- ===================================================================
-- 1. CONTROLS TABLE
-- ===================================================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can view controls" ON controls;
DROP POLICY IF EXISTS "Authenticated users can manage controls" ON controls;

-- Ensure RLS is enabled
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view controls
CREATE POLICY "Authenticated users can view controls"
ON controls
FOR SELECT
TO authenticated
USING (true);

-- Policy: All authenticated users can insert controls
CREATE POLICY "Authenticated users can insert controls"
ON controls
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: All authenticated users can update controls
CREATE POLICY "Authenticated users can update controls"
ON controls
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: All authenticated users can delete controls
CREATE POLICY "Authenticated users can delete controls"
ON controls
FOR DELETE
TO authenticated
USING (true);


-- ===================================================================
-- 2. CONTROL_TEMPLATE_LINKS TABLE
-- ===================================================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can view template links" ON control_template_links;
DROP POLICY IF EXISTS "Authenticated users can manage template links" ON control_template_links;

-- Ensure RLS is enabled
ALTER TABLE control_template_links ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view template links
CREATE POLICY "Authenticated users can view template links"
ON control_template_links
FOR SELECT
TO authenticated
USING (true);

-- Policy: All authenticated users can insert template links
CREATE POLICY "Authenticated users can insert template links"
ON control_template_links
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: All authenticated users can update template links
CREATE POLICY "Authenticated users can update template links"
ON control_template_links
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: All authenticated users can delete template links
CREATE POLICY "Authenticated users can delete template links"
ON control_template_links
FOR DELETE
TO authenticated
USING (true);


-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('controls', 'control_template_links')
ORDER BY tablename;

-- View policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('controls', 'control_template_links')
ORDER BY tablename, policyname;
