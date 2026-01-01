-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table (SHARED across all users)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  industry TEXT NOT NULL CHECK (industry IN (
    'Technology', 'Manufacturing', 'Finance', 'Healthcare',
    'Retail', 'Energy', 'Transportation', 'Public Administration',
    'Telecommunications', 'Consulting'
  )),
  is_public_sector BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities table (USER-SPECIFIC with RLS)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,

  -- Financial data
  tcv NUMERIC NOT NULL CHECK (tcv > 0 AND tcv < 1000000000),
  first_margin_percentage NUMERIC NOT NULL CHECK (first_margin_percentage >= 0 AND first_margin_percentage <= 100),
  raise_tcv NUMERIC,

  -- Business data
  industry TEXT,
  is_public_sector BOOLEAN DEFAULT false,
  expected_decision_date DATE NOT NULL,
  expected_signature_date DATE,
  expected_delivery_start DATE,
  has_kcp_deviations BOOLEAN NOT NULL DEFAULT false,
  kcp_deviations_detail TEXT,

  -- RAISE calculation results
  raise_level TEXT NOT NULL CHECK (raise_level IN ('L1', 'L2', 'L3', 'L4', 'L5', 'L6')),
  is_fast_track BOOLEAN NOT NULL DEFAULT false,

  -- Workflow state
  current_phase TEXT NOT NULL DEFAULT 'Planning' CHECK (current_phase IN (
    'Planning', 'ATP', 'ATS', 'ATC', 'Won', 'Lost', 'Handover'
  )),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Won', 'Lost')),
  checkpoints JSONB NOT NULL DEFAULT '{}',

  -- User ownership (EMAIL from SAP IAS)
  created_by_email TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings/Checkpoints table (SHARED across all users)
CREATE TABLE settings (
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

-- Create indexes for performance
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by_email);
CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_phase ON opportunities(current_phase);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_settings_phase ON settings(phase);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
