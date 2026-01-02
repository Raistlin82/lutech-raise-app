-- Verification script for existing Supabase schema
-- Run this in Supabase SQL Editor to check current state

-- 1. Check if opportunities table has created_by_email column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on opportunities
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('opportunities', 'customers', 'settings');

-- 3. Check existing RLS policies on opportunities
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'opportunities';

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
  'settings' as table_name,
  COUNT(*) as row_count
FROM settings;
