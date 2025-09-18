-- Fix Editor Requests Issues
-- Run this script to fix the existing database issues

-- Drop and recreate the function with correct parameter names
DROP FUNCTION IF EXISTS user_has_entity_permission(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION user_has_entity_permission(
  user_email_param TEXT,
  entity_type_param TEXT,
  entity_id_param UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is superuser (they have all permissions)
  IF EXISTS (
    SELECT 1 FROM approved_users 
    WHERE email = user_email_param AND role = 'superuser'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has specific entity permission
  RETURN EXISTS (
    SELECT 1 FROM user_entity_permissions 
    WHERE user_email = user_email_param 
    AND entity_type = entity_type_param 
    AND entity_id = entity_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_has_entity_permission(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_entity_permission(TEXT, TEXT, UUID) TO anon;

-- Fix RLS policies for editor_requests
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create editor requests" ON editor_requests;
DROP POLICY IF EXISTS "Superusers can view editor requests" ON editor_requests;
DROP POLICY IF EXISTS "Superusers can update editor requests" ON editor_requests;

-- Create new policies
CREATE POLICY "Anyone can create editor requests" ON editor_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Superusers can view editor requests" ON editor_requests
  FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can update editor requests" ON editor_requests
  FOR UPDATE USING (is_superuser());

-- Grant necessary permissions
GRANT INSERT ON editor_requests TO anon;
GRANT USAGE ON SCHEMA public TO anon;
