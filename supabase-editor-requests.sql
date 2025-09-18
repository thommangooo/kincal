-- Editor Requests Table for Kin Calendar
-- This table stores requests from users who want to become editors

-- Create the editor_requests table
CREATE TABLE IF NOT EXISTS editor_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('club', 'zone', 'district')),
  entity_id UUID NOT NULL,
  message_to_approver TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_email VARCHAR(255),
  admin_notes TEXT,
  
  -- Foreign key constraints
  CONSTRAINT fk_editor_requests_club FOREIGN KEY (entity_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_editor_requests_zone FOREIGN KEY (entity_id) REFERENCES zones(id) ON DELETE CASCADE,
  CONSTRAINT fk_editor_requests_district FOREIGN KEY (entity_id) REFERENCES districts(id) ON DELETE CASCADE
);

-- Add check constraint to ensure entity_type matches the referenced table
-- Note: This is a simplified approach - in a more complex system, you might want separate tables
-- or a more sophisticated constraint system

-- Create indexes for better performance
CREATE INDEX idx_editor_requests_email ON editor_requests(email);
CREATE INDEX idx_editor_requests_status ON editor_requests(status);
CREATE INDEX idx_editor_requests_entity ON editor_requests(entity_type, entity_id);
CREATE INDEX idx_editor_requests_created_at ON editor_requests(created_at);
CREATE INDEX idx_editor_requests_ip_address ON editor_requests(ip_address);

-- Enable RLS
ALTER TABLE editor_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for editor_requests
-- Anyone can create requests (for the form) - no authentication required
CREATE POLICY "Anyone can create editor requests" ON editor_requests
  FOR INSERT WITH CHECK (true);

-- Only superusers can view and manage requests
CREATE POLICY "Superusers can view editor requests" ON editor_requests
  FOR SELECT USING (is_superuser());

CREATE POLICY "Superusers can update editor requests" ON editor_requests
  FOR UPDATE USING (is_superuser());

-- Allow anonymous access for creating requests
GRANT INSERT ON editor_requests TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Note: Duplicate request prevention within 24 hours is handled in application logic
-- to avoid issues with NOW() function in index predicates

-- Add index for efficient duplicate checking in application logic
CREATE INDEX idx_editor_requests_email_entity_status ON editor_requests(email, entity_type, entity_id, status, created_at);

-- Add a function to check if a user already has permissions for an entity
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

-- Note: Entity name resolution will be handled in the application code
-- to avoid complexity with database functions and indexes


