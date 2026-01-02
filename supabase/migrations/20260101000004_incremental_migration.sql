-- Incremental migration: Add missing tables and columns
-- This script is SAFE to run multiple times (uses IF NOT EXISTS checks)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Add created_by_email to opportunities if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opportunities'
      AND column_name = 'created_by_email'
  ) THEN
    ALTER TABLE opportunities
    ADD COLUMN created_by_email TEXT;

    -- Set a default value for existing rows
    UPDATE opportunities
    SET created_by_email = 'migration@legacy.local'
    WHERE created_by_email IS NULL;

    -- Make it NOT NULL after setting defaults
    ALTER TABLE opportunities
    ALTER COLUMN created_by_email SET NOT NULL;

    RAISE NOTICE 'Added created_by_email column to opportunities';
  ELSE
    RAISE NOTICE 'created_by_email column already exists';
  END IF;
END $$;

-- 2. Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL')),
  raise_levels TEXT[] NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by_email);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_phase ON opportunities(current_phase);
CREATE INDEX IF NOT EXISTS idx_settings_phase ON settings(phase);
CREATE INDEX IF NOT EXISTS idx_settings_display_order ON settings(display_order);

-- 4. Create triggers for updated_at if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Summary
SELECT
  'Migration complete' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'created_by_email') as has_created_by_email,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'settings' AND table_schema = 'public') as has_settings_table;
