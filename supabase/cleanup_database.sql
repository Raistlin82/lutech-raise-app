-- =====================================================
-- RAISE App - Supabase Database Cleanup Script
-- =====================================================
-- This script removes all data EXCEPT controls and
-- control_template_links tables.
--
-- WARNING: This will permanently delete all:
--   - Opportunities
--   - Customers
--   - KCP Deviations
--   - Opportunity Checkpoints
--
-- Controls and their template links will be preserved.
-- =====================================================

-- Step 1: Disable foreign key checks temporarily (if needed)
-- Note: Supabase/PostgreSQL handles cascading deletes via FK constraints

-- Step 2: Delete data from tables that depend on opportunities
-- Delete opportunity checkpoints first (references opportunities)
DELETE FROM opportunity_checkpoints;
SELECT 'Deleted all opportunity_checkpoints' AS status;

-- Delete KCP deviations (references opportunities)
DELETE FROM kcp_deviations;
SELECT 'Deleted all kcp_deviations' AS status;

-- Step 3: Delete opportunities
DELETE FROM opportunities;
SELECT 'Deleted all opportunities' AS status;

-- Step 4: Delete customers (no FK dependencies after opportunities are gone)
DELETE FROM customers;
SELECT 'Deleted all customers' AS status;

-- Step 5: Verify what remains
SELECT 'Remaining data summary:' AS status;
SELECT 'controls' AS table_name, COUNT(*) AS row_count FROM controls
UNION ALL
SELECT 'control_template_links', COUNT(*) FROM control_template_links
UNION ALL
SELECT 'opportunities', COUNT(*) FROM opportunities
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'kcp_deviations', COUNT(*) FROM kcp_deviations
UNION ALL
SELECT 'opportunity_checkpoints', COUNT(*) FROM opportunity_checkpoints;

-- =====================================================
-- Cleanup Complete
-- =====================================================
