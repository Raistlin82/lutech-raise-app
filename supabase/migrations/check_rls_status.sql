-- ===================================================================
-- Check current RLS status for controls tables
-- ===================================================================

-- 1. Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('controls', 'control_template_links')
ORDER BY tablename;

-- 2. Check existing policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('controls', 'control_template_links')
ORDER BY tablename, policyname;

-- 3. Count rows in tables
SELECT
    'controls' as table_name,
    COUNT(*) as row_count
FROM controls
UNION ALL
SELECT
    'control_template_links' as table_name,
    COUNT(*) as row_count
FROM control_template_links;

-- 4. Check if tables exist
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('controls', 'control_template_links')
ORDER BY table_name;
