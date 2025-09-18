-- Temporarily disable RLS on approved_users table
-- This allows the approval process to work without RLS conflicts

-- Disable RLS temporarily
ALTER TABLE approved_users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT ON approved_users TO authenticated;
GRANT INSERT ON approved_users TO authenticated;
GRANT UPDATE ON approved_users TO authenticated;
GRANT DELETE ON approved_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
