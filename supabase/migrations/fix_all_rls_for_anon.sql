-- ===================================================================
-- Fix ALL RLS Policies to work with ANON role
-- ===================================================================
-- The app uses Supabase anon key, so policies must allow BOTH
-- anon and authenticated roles.
-- ===================================================================

-- ===================================================================
-- 1. CUSTOMERS TABLE - Shared data, everyone can CRUD
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

-- Keep RLS enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for BOTH anon and authenticated
CREATE POLICY "Everyone can view customers"
ON customers
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Everyone can insert customers"
ON customers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Everyone can update customers"
ON customers
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Everyone can delete customers"
ON customers
FOR DELETE
TO anon, authenticated
USING (true);


-- ===================================================================
-- 2. OPPORTUNITIES TABLE - User-specific data
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can insert own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can update own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can delete own opportunities" ON opportunities;

-- Keep RLS enabled
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for BOTH anon and authenticated
-- Note: created_by_email is set by the application, not by RLS
CREATE POLICY "Users can view own opportunities"
ON opportunities
FOR SELECT
TO anon, authenticated
USING (created_by_email = auth.jwt()->>'email' OR auth.jwt()->>'email' IS NULL);

CREATE POLICY "Users can insert own opportunities"
ON opportunities
FOR INSERT
TO anon, authenticated
WITH CHECK (true);  -- App sets created_by_email

CREATE POLICY "Users can update own opportunities"
ON opportunities
FOR UPDATE
TO anon, authenticated
USING (created_by_email = auth.jwt()->>'email' OR auth.jwt()->>'email' IS NULL)
WITH CHECK (created_by_email = auth.jwt()->>'email' OR auth.jwt()->>'email' IS NULL);

CREATE POLICY "Users can delete own opportunities"
ON opportunities
FOR DELETE
TO anon, authenticated
USING (created_by_email = auth.jwt()->>'email' OR auth.jwt()->>'email' IS NULL);


-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Check RLS status
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'opportunities', 'controls', 'control_template_links')
ORDER BY tablename;

-- Check policies
SELECT
    tablename,
    policyname,
    cmd AS operation,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'opportunities')
ORDER BY tablename, policyname;
