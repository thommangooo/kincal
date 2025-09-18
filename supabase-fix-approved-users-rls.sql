-- Fix RLS policies for approved_users table
-- This allows superusers to query the approved_users table during the approval process

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved users" ON approved_users;
DROP POLICY IF EXISTS "Superusers can manage approved users" ON approved_users;

-- Create new policies that work with the approval process
-- Allow anyone to view approved users (needed for duplicate checking)
CREATE POLICY "Anyone can view approved users" ON approved_users
  FOR SELECT USING (true);

-- Allow superusers to manage approved users
CREATE POLICY "Superusers can manage approved users" ON approved_users
  FOR ALL USING (is_superuser());

-- Grant necessary permissions
GRANT SELECT ON approved_users TO authenticated;
GRANT SELECT ON approved_users TO anon;
GRANT INSERT ON approved_users TO authenticated;
GRANT UPDATE ON approved_users TO authenticated;
GRANT DELETE ON approved_users TO authenticated;
