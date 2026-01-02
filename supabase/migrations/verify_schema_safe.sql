-- Verification script for existing Supabase schema (safe version)
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

-- 4. Check which tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('opportunities', 'customers', 'settings')
ORDER BY table_name;

-- 5. Count existing data (only for tables that exist)
SELECT
  'opportunities' as table_name,
  COUNT(*) as row_count
FROM opportunities
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'opportunities' AND table_schema = 'public'
)
UNION ALL
SELECT
  'customers' as table_name,
  COUNT(*) as row_count
FROM customers
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'customers' AND table_schema = 'public'
);
