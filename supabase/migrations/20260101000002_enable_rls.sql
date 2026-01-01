-- Enable RLS on opportunities table (user-specific data)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own opportunities
CREATE POLICY "users_see_own_opportunities"
ON opportunities
FOR SELECT
USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only insert opportunities with their email
CREATE POLICY "users_insert_own_opportunities"
ON opportunities
FOR INSERT
WITH CHECK (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only update their own opportunities
CREATE POLICY "users_update_own_opportunities"
ON opportunities
FOR UPDATE
USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only delete their own opportunities
CREATE POLICY "users_delete_own_opportunities"
ON opportunities
FOR DELETE
USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- NO RLS on customers table (shared data - all users can CRUD)
-- Customers are shared resources, no restrictions needed

-- NO RLS on settings table (shared data - all users can read, admin can write)
-- Settings are shared configuration, no restrictions needed

-- Grant necessary permissions to authenticated users
GRANT ALL ON customers TO authenticated;
GRANT ALL ON opportunities TO authenticated;
GRANT SELECT ON settings TO authenticated;

-- Add comment explaining RLS strategy
COMMENT ON TABLE opportunities IS 'User-specific data: RLS enforces created_by_email = JWT email';
COMMENT ON TABLE customers IS 'Shared data: All authenticated users can CRUD';
COMMENT ON TABLE settings IS 'Shared data: All authenticated users can read';
