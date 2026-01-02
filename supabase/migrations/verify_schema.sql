-- Verification script for existing Supabase schema
-- Run this in Supabase SQL Editor to check current state

-- 1. Check if opportunities table has created_by_email column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('opportunities', 'customers', 'controls', 'control_template_links')
ORDER BY tablename;

-- 3. Check existing RLS policies on all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('opportunities', 'customers', 'controls', 'control_template_links')
ORDER BY tablename, policyname;

-- 4. Count existing data
SELECT
  'opportunities' as table_name,
  COUNT(*) as row_count
FROM opportunities
UNION ALL
SELECT
  'customers' as table_name,
  COUNT(*) as row_count
FROM customers
UNION ALL
SELECT
  'controls' as table_name,
  COUNT(*) as row_count
FROM controls
UNION ALL
SELECT
  'control_template_links' as table_name,
  COUNT(*) as row_count
FROM control_template_links;
