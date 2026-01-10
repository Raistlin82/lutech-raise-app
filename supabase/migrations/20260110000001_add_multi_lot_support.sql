-- Add Multi-Lot Support Columns
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS is_multi_lot boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS are_lots_mutually_exclusive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lots jsonb DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN opportunities.is_multi_lot IS 'Flag to indicate if the opportunity has multiple lots';
COMMENT ON COLUMN opportunities.are_lots_mutually_exclusive IS 'Flag to indicate if the lots are mutually exclusive (only one can be won)';
COMMENT ON COLUMN opportunities.lots IS 'JSONB array storing the detailed lots information';
