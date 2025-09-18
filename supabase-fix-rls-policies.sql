-- Comprehensive fix for Editor Requests RLS policies
-- This script fixes all the permission issues

-- First, let's check if the table exists and drop/recreate policies
DROP POLICY IF EXISTS "Anyone can create editor requests" ON editor_requests;
DROP POLICY IF EXISTS "Superusers can view editor requests" ON editor_requests;
DROP POLICY IF EXISTS "Superusers can update editor requests" ON editor_requests;

-- Create a more permissive policy for anonymous users to create requests
CREATE POLICY "Allow anonymous insert" ON editor_requests
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Create a more permissive policy for authenticated users to create requests
CREATE POLICY "Allow authenticated insert" ON editor_requests
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Superusers can view all requests
CREATE POLICY "Superusers can view editor requests" ON editor_requests
  FOR SELECT 
  TO authenticated
  USING (is_superuser());

-- Superusers can update all requests
CREATE POLICY "Superusers can update editor requests" ON editor_requests
  FOR UPDATE 
  TO authenticated
  USING (is_superuser());

-- Grant explicit permissions
GRANT INSERT ON editor_requests TO anon;
GRANT INSERT ON editor_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Also grant SELECT permission for the duplicate checking query
GRANT SELECT ON editor_requests TO anon;
GRANT SELECT ON editor_requests TO authenticated;
