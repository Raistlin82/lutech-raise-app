-- Migration: Add missing date columns to opportunities table
-- This fixes the "expected_decision_date not found" error

DO $$
BEGIN
    -- expected_decision_date (required)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'expected_decision_date') THEN
        ALTER TABLE opportunities ADD COLUMN expected_decision_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added expected_decision_date column';
    END IF;

    -- expected_signature_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'expected_signature_date') THEN
        ALTER TABLE opportunities ADD COLUMN expected_signature_date TIMESTAMPTZ;
        RAISE NOTICE 'Added expected_signature_date column';
    END IF;

    -- expected_delivery_start (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'expected_delivery_start') THEN
        ALTER TABLE opportunities ADD COLUMN expected_delivery_start TIMESTAMPTZ;
        RAISE NOTICE 'Added expected_delivery_start column';
    END IF;

    -- offer_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'offer_date') THEN
        ALTER TABLE opportunities ADD COLUMN offer_date TIMESTAMPTZ;
        RAISE NOTICE 'Added offer_date column';
    END IF;

    -- contract_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'contract_date') THEN
        ALTER TABLE opportunities ADD COLUMN contract_date TIMESTAMPTZ;
        RAISE NOTICE 'Added contract_date column';
    END IF;

    -- order_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'order_date') THEN
        ALTER TABLE opportunities ADD COLUMN order_date TIMESTAMPTZ;
        RAISE NOTICE 'Added order_date column';
    END IF;

    -- ats_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'ats_date') THEN
        ALTER TABLE opportunities ADD COLUMN ats_date TIMESTAMPTZ;
        RAISE NOTICE 'Added ats_date column';
    END IF;

    -- atc_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'atc_date') THEN
        ALTER TABLE opportunities ADD COLUMN atc_date TIMESTAMPTZ;
        RAISE NOTICE 'Added atc_date column';
    END IF;

    -- rcp_date (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'rcp_date') THEN
        ALTER TABLE opportunities ADD COLUMN rcp_date TIMESTAMPTZ;
        RAISE NOTICE 'Added rcp_date column';
    END IF;

    -- client_name (optional - for when no customer_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'client_name') THEN
        ALTER TABLE opportunities ADD COLUMN client_name TEXT;
        RAISE NOTICE 'Added client_name column';
    END IF;

    -- cash_flow_neutral (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'cash_flow_neutral') THEN
        ALTER TABLE opportunities ADD COLUMN cash_flow_neutral BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added cash_flow_neutral column';
    END IF;

    -- services_value (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'services_value') THEN
        ALTER TABLE opportunities ADD COLUMN services_value NUMERIC;
        RAISE NOTICE 'Added services_value column';
    END IF;

    -- is_rti (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_rti') THEN
        ALTER TABLE opportunities ADD COLUMN is_rti BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_rti column';
    END IF;

    -- is_mandataria (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_mandataria') THEN
        ALTER TABLE opportunities ADD COLUMN is_mandataria BOOLEAN;
        RAISE NOTICE 'Added is_mandataria column';
    END IF;

    -- has_social_clauses (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'has_social_clauses') THEN
        ALTER TABLE opportunities ADD COLUMN has_social_clauses BOOLEAN;
        RAISE NOTICE 'Added has_social_clauses column';
    END IF;

    -- is_non_core_business (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_non_core_business') THEN
        ALTER TABLE opportunities ADD COLUMN is_non_core_business BOOLEAN;
        RAISE NOTICE 'Added is_non_core_business column';
    END IF;

    -- has_low_risk_services (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'has_low_risk_services') THEN
        ALTER TABLE opportunities ADD COLUMN has_low_risk_services BOOLEAN;
        RAISE NOTICE 'Added has_low_risk_services column';
    END IF;

    -- is_small_ticket (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_small_ticket') THEN
        ALTER TABLE opportunities ADD COLUMN is_small_ticket BOOLEAN;
        RAISE NOTICE 'Added is_small_ticket column';
    END IF;

    -- is_new_customer (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_new_customer') THEN
        ALTER TABLE opportunities ADD COLUMN is_new_customer BOOLEAN;
        RAISE NOTICE 'Added is_new_customer column';
    END IF;

    -- is_child (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_child') THEN
        ALTER TABLE opportunities ADD COLUMN is_child BOOLEAN;
        RAISE NOTICE 'Added is_child column';
    END IF;

    -- has_suppliers (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'has_suppliers') THEN
        ALTER TABLE opportunities ADD COLUMN has_suppliers BOOLEAN;
        RAISE NOTICE 'Added has_suppliers column';
    END IF;

    -- supplier_alignment (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'supplier_alignment') THEN
        ALTER TABLE opportunities ADD COLUMN supplier_alignment TEXT;
        RAISE NOTICE 'Added supplier_alignment column';
    END IF;

    -- privacy_risk_level (optional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'privacy_risk_level') THEN
        ALTER TABLE opportunities ADD COLUMN privacy_risk_level TEXT;
        RAISE NOTICE 'Added privacy_risk_level column';
    END IF;

END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities'
ORDER BY ordinal_position;
