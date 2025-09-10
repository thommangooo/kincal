-- Whitelist Users for Kin Calendar
-- This script creates a whitelist of approved users who can sign in and create content

-- Create a whitelist table for approved users
CREATE TABLE IF NOT EXISTS approved_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('superuser', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- Create policies for approved_users
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view approved users" ON approved_users;
    DROP POLICY IF EXISTS "Admins can manage approved users" ON approved_users;
    
    -- Create new policies
    CREATE POLICY "Anyone can view approved users" ON approved_users
      FOR SELECT USING (true);
    
    CREATE POLICY "Superusers can manage approved users" ON approved_users
      FOR ALL USING (email = current_setting('request.jwt.claims', true)::json->>'email' 
                     AND role = 'superuser');
END $$;

-- Insert some sample approved users
INSERT INTO approved_users (email, name, role) VALUES
  ('t.hom.hounsell@gmail.com', 'Thom Editor', 'editor'),
  ('thom.hounsell@gmail.com', 'Thom Superuser', 'superuser')
ON CONFLICT (email) DO NOTHING;

-- Add your email here (replace with your actual email)
-- INSERT INTO approved_users (email, name, role) VALUES
--   ('your-email@example.com', 'Your Name', 'superuser')
-- ON CONFLICT (email) DO NOTHING;

-- Update the user_entity_permissions to use the approved users
-- First, clear existing demo permissions
DELETE FROM user_entity_permissions WHERE user_email = 'demo@example.com';

-- Add entity permissions for demo user (can post for 3 clubs, 2 zones, 1 district)
INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) 
SELECT 't.hom.hounsell@gmail.com', 'club', id FROM clubs LIMIT 3
ON CONFLICT (user_email, entity_id) DO NOTHING;

INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) 
SELECT 't.hom.hounsell@gmail.com', 'zone', id FROM zones LIMIT 2
ON CONFLICT (user_email, entity_id) DO NOTHING;

INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) 
SELECT 't.hom.hounsell@gmail.com', 'district', id FROM districts LIMIT 1
ON CONFLICT (user_email, entity_id) DO NOTHING;

-- Note: Superusers don't need entity permissions - they can post for any entity
-- The EntitySelector component will check the user's role and show all entities for superusers
