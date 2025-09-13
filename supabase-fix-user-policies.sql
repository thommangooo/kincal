-- Fix RLS policies for approved_users table
-- This creates secure policies that avoid infinite recursion

-- Drop existing policies and function
DROP POLICY IF EXISTS "Anyone can view approved users" ON approved_users;
DROP POLICY IF EXISTS "Superusers can manage approved users" ON approved_users;
DROP FUNCTION IF EXISTS is_superuser();

-- Create a function that bypasses RLS to check superuser status
CREATE OR REPLACE FUNCTION is_superuser()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users 
    WHERE email = auth.email() 
    AND role = 'superuser'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_superuser() TO authenticated;

-- Create new policies that work with Supabase auth
CREATE POLICY "Anyone can view approved users" ON approved_users
  FOR SELECT USING (true);

-- Allow superusers to manage approved users using the function
CREATE POLICY "Superusers can manage approved users" ON approved_users
  FOR ALL USING (is_superuser());

-- Fix RLS policies for user_entity_permissions table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_entity_permissions;
DROP POLICY IF EXISTS "System can manage permissions" ON user_entity_permissions;

-- Create new policies for user_entity_permissions
-- Allow users to view their own permissions
CREATE POLICY "Users can view their own permissions" ON user_entity_permissions
  FOR SELECT USING (user_email = auth.email());

-- Allow superusers to manage all permissions
CREATE POLICY "Superusers can manage permissions" ON user_entity_permissions
  FOR ALL USING (is_superuser());
    