-- Create settings table only (safe if already exists)
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_settings_phase ON settings(phase);
CREATE INDEX IF NOT EXISTS idx_settings_display_order ON settings(display_order);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions
GRANT SELECT ON settings TO authenticated;

-- Verify
SELECT 'Settings table ready' as status;
