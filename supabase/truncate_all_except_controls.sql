-- =====================================================
-- RAISE App - Fast TRUNCATE Script
-- =====================================================
-- Faster alternative using TRUNCATE (resets sequences)
-- Keeps: controls, control_template_links
-- Deletes: Everything else
--
-- WARNING: TRUNCATE is faster but cannot be rolled back!
-- =====================================================

-- Use TRUNCATE with CASCADE to handle foreign keys automatically
-- This is faster than DELETE for large tables

-- Truncate in correct order to respect foreign key constraints
TRUNCATE TABLE opportunity_checkpoints CASCADE;
TRUNCATE TABLE kcp_deviations CASCADE;
TRUNCATE TABLE opportunities CASCADE;
TRUNCATE TABLE customers CASCADE;

-- Verify cleanup
SELECT
    'controls' AS table_name,
    COUNT(*) AS row_count
FROM controls

UNION ALL

SELECT
    'control_template_links',
    COUNT(*)
FROM control_template_links

UNION ALL

SELECT
    'opportunities',
    COUNT(*)
FROM opportunities

UNION ALL

SELECT
    'customers',
    COUNT(*)
FROM customers;

-- =====================================================
-- Done - Only controls remain
-- =====================================================
