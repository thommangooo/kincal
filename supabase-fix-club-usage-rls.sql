-- Fix RLS policies for club usage status queries
-- This allows the system to query all user_entity_permissions for club usage status

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_entity_permissions;
DROP POLICY IF EXISTS "Users can view their own entity permissions" ON user_entity_permissions;

-- Create a new policy that allows viewing all permissions for club usage status
-- This is needed because the club filtering needs to see all permissions to determine which clubs are active
CREATE POLICY "Allow viewing all permissions for club usage status" ON user_entity_permissions
  FOR SELECT USING (true);

-- Keep the existing superuser management policy
-- (This should already exist from previous scripts)
