-- Migration: Add missing columns to existing tables (if needed)
-- Run this ONLY if verify_schema.sql shows created_by_email is missing

-- Add created_by_email to opportunities if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opportunities'
      AND column_name = 'created_by_email'
  ) THEN
    ALTER TABLE opportunities
    ADD COLUMN created_by_email TEXT;

    -- Set a default value for existing rows (use a placeholder email)
    UPDATE opportunities
    SET created_by_email = 'legacy@migration.local'
    WHERE created_by_email IS NULL;

    -- Make it NOT NULL after setting defaults
    ALTER TABLE opportunities
    ALTER COLUMN created_by_email SET NOT NULL;

    RAISE NOTICE 'Added created_by_email column to opportunities table';
  ELSE
    RAISE NOTICE 'created_by_email column already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND column_name = 'created_by_email';
