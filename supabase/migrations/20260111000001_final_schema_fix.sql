-- Final Schema Cleanup & Multi-Lot Support
-- This script ensures the 'opportunities' table matches the code's expectations

DO $$
BEGIN
    -- 1. Handling margin_percent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'margin_percent') THEN
        ALTER TABLE opportunities ADD COLUMN margin_percent NUMERIC;
    END IF;

    -- 2. Handling first_margin_percent (standard name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'first_margin_percent') THEN
        ALTER TABLE opportunities ADD COLUMN first_margin_percent NUMERIC;
    END IF;

    -- 3. Migration of data from old column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'first_margin_percentage') THEN
        UPDATE opportunities SET first_margin_percent = first_margin_percentage WHERE first_margin_percent IS NULL;
        ALTER TABLE opportunities DROP COLUMN first_margin_percentage;
    END IF;

    -- 4. Handling checkpoints (redundant column, using separate table)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'checkpoints') THEN
        ALTER TABLE opportunities DROP COLUMN checkpoints;
    END IF;

    -- 5. Multi-Lot Support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'is_multi_lot') THEN
        ALTER TABLE opportunities ADD COLUMN is_multi_lot BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'are_lots_mutually_exclusive') THEN
        ALTER TABLE opportunities ADD COLUMN are_lots_mutually_exclusive BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'lots') THEN
        ALTER TABLE opportunities ADD COLUMN lots JSONB DEFAULT '[]'::jsonb;
    END IF;

END $$;

COMMENT ON COLUMN opportunities.margin_percent IS 'Overall margin percentage';
COMMENT ON COLUMN opportunities.first_margin_percent IS 'Initial margin percentage (at Planning phase)';
COMMENT ON COLUMN opportunities.is_multi_lot IS 'Flag to indicate if the opportunity has multiple lots';
COMMENT ON COLUMN opportunities.lots IS 'Detailed lots data';
