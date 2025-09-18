-- Temporary fix: Disable RLS on editor_requests table
-- This allows anonymous users to create requests

-- Disable RLS temporarily
ALTER TABLE editor_requests DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anonymous users
GRANT INSERT ON editor_requests TO anon;
GRANT SELECT ON editor_requests TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions to authenticated users
GRANT INSERT ON editor_requests TO authenticated;
GRANT SELECT ON editor_requests TO authenticated;
GRANT UPDATE ON editor_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
