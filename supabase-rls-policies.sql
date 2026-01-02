-- ===================================================================
-- RAISE App - Row Level Security (RLS) Policies
-- ===================================================================
-- This file contains all RLS policies required for data segregation
-- and security in the RAISE application.
--
-- Execute this on Supabase SQL Editor to enable RLS on all tables.
-- ===================================================================

-- ===================================================================
-- 1. OPPORTUNITIES TABLE - User-specific data
-- ===================================================================
-- Each user can only see and modify their own opportunities

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own opportunities
CREATE POLICY "Users can view own opportunities"
ON opportunities
FOR SELECT
TO authenticated
USING (created_by_email = auth.jwt()->>'email');

-- Policy: Users can insert opportunities (with their email)
CREATE POLICY "Users can insert own opportunities"
ON opportunities
FOR INSERT
TO authenticated
WITH CHECK (created_by_email = auth.jwt()->>'email');

-- Policy: Users can update only their own opportunities
CREATE POLICY "Users can update own opportunities"
ON opportunities
FOR UPDATE
TO authenticated
USING (created_by_email = auth.jwt()->>'email')
WITH CHECK (created_by_email = auth.jwt()->>'email');

-- Policy: Users can delete only their own opportunities
CREATE POLICY "Users can delete own opportunities"
ON opportunities
FOR DELETE
TO authenticated
USING (created_by_email = auth.jwt()->>'email');


-- ===================================================================
-- 2. CUSTOMERS TABLE - Shared across all users
-- ===================================================================
-- Customers are shared resources - all authenticated users can CRUD

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view customers
CREATE POLICY "Authenticated users can view customers"
ON customers
FOR SELECT
TO authenticated
USING (true);

-- Policy: All authenticated users can insert customers
CREATE POLICY "Authenticated users can insert customers"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: All authenticated users can update customers
CREATE POLICY "Authenticated users can update customers"
ON customers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: All authenticated users can delete customers (with FK check)
CREATE POLICY "Authenticated users can delete customers"
ON customers
FOR DELETE
TO authenticated
USING (true);


-- ===================================================================
-- 3. SETTINGS TABLE - Global configuration (read-only for users)
-- ===================================================================
-- Settings are global configuration, read by all, managed by admins

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view settings
CREATE POLICY "Authenticated users can view settings"
ON settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can modify settings (if admin role exists)
-- Uncomment and adjust if you have admin role management
-- CREATE POLICY "Admins can modify settings"
-- ON settings
-- FOR ALL
-- TO authenticated
-- USING (auth.jwt()->>'role' = 'admin')
-- WITH CHECK (auth.jwt()->>'role' = 'admin');


-- ===================================================================
-- 4. CONTROLS TABLE - Global control templates
-- ===================================================================
-- Controls are shared configuration for checkpoints

-- Enable RLS (if table exists)
-- Note: This table may not exist yet in your schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'controls') THEN
        ALTER TABLE controls ENABLE ROW LEVEL SECURITY;

        -- Policy: All authenticated users can view controls
        EXECUTE 'CREATE POLICY "Authenticated users can view controls"
        ON controls
        FOR SELECT
        TO authenticated
        USING (true)';

        -- Policy: Authenticated users can manage controls
        -- Adjust based on your requirements (admin-only or all users)
        EXECUTE 'CREATE POLICY "Authenticated users can manage controls"
        ON controls
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true)';
    END IF;
END $$;


-- ===================================================================
-- 5. CONTROL_TEMPLATE_LINKS TABLE - Links for controls
-- ===================================================================
-- Template links associated with controls

-- Enable RLS (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'control_template_links') THEN
        ALTER TABLE control_template_links ENABLE ROW LEVEL SECURITY;

        -- Policy: All authenticated users can view template links
        EXECUTE 'CREATE POLICY "Authenticated users can view template links"
        ON control_template_links
        FOR SELECT
        TO authenticated
        USING (true)';

        -- Policy: Authenticated users can manage template links
        EXECUTE 'CREATE POLICY "Authenticated users can manage template links"
        ON control_template_links
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true)';
    END IF;
END $$;


-- ===================================================================
-- 6. KCP_DEVIATIONS TABLE - User-specific deviations
-- ===================================================================
-- Deviations belong to opportunities, inherit user ownership

-- Enable RLS (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kcp_deviations') THEN
        ALTER TABLE kcp_deviations ENABLE ROW LEVEL SECURITY;

        -- Policy: Users can view deviations of their own opportunities
        EXECUTE 'CREATE POLICY "Users can view own deviations"
        ON kcp_deviations
        FOR SELECT
        TO authenticated
        USING (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';

        -- Policy: Users can insert deviations for their own opportunities
        EXECUTE 'CREATE POLICY "Users can insert own deviations"
        ON kcp_deviations
        FOR INSERT
        TO authenticated
        WITH CHECK (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';

        -- Policy: Users can update/delete deviations of their own opportunities
        EXECUTE 'CREATE POLICY "Users can modify own deviations"
        ON kcp_deviations
        FOR UPDATE
        TO authenticated
        USING (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )
        WITH CHECK (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';

        EXECUTE 'CREATE POLICY "Users can delete own deviations"
        ON kcp_deviations
        FOR DELETE
        TO authenticated
        USING (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';
    END IF;
END $$;


-- ===================================================================
-- 7. OPPORTUNITY_CHECKPOINTS TABLE - User-specific checkpoints
-- ===================================================================
-- Checkpoints belong to opportunities, inherit user ownership

-- Enable RLS (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'opportunity_checkpoints') THEN
        ALTER TABLE opportunity_checkpoints ENABLE ROW LEVEL SECURITY;

        -- Policy: Users can view checkpoints of their own opportunities
        EXECUTE 'CREATE POLICY "Users can view own checkpoints"
        ON opportunity_checkpoints
        FOR SELECT
        TO authenticated
        USING (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';

        -- Policy: Users can insert checkpoints for their own opportunities
        EXECUTE 'CREATE POLICY "Users can insert own checkpoints"
        ON opportunity_checkpoints
        FOR INSERT
        TO authenticated
        WITH CHECK (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';

        -- Policy: Users can update/delete checkpoints of their own opportunities
        EXECUTE 'CREATE POLICY "Users can modify own checkpoints"
        ON opportunity_checkpoints
        FOR UPDATE
        TO authenticated
        USING (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )
        WITH CHECK (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';

        EXECUTE 'CREATE POLICY "Users can delete own checkpoints"
        ON opportunity_checkpoints
        FOR DELETE
        TO authenticated
        USING (
            opportunity_id IN (
                SELECT id FROM opportunities
                WHERE created_by_email = auth.jwt()->>''email''
            )
        )';
    END IF;
END $$;


-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
-- Run these to verify RLS is enabled on all tables

SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'opportunities',
    'customers',
    'settings',
    'controls',
    'control_template_links',
    'kcp_deviations',
    'opportunity_checkpoints'
  )
ORDER BY tablename;

-- View all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
