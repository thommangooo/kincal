-- Entity Permissions System
-- This script adds user entity permissions to the database

-- Create user_entity_permissions table
CREATE TABLE IF NOT EXISTS user_entity_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('club', 'zone', 'district')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_entity_permissions_email ON user_entity_permissions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_entity_permissions_entity ON user_entity_permissions(entity_type, entity_id);

-- Enable RLS
ALTER TABLE user_entity_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_entity_permissions
CREATE POLICY "Users can view their own permissions" ON user_entity_permissions
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can manage permissions" ON user_entity_permissions
  FOR ALL USING (false); -- Only system/admin can manage permissions

-- Add entity_type and entity_id to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) CHECK (entity_type IN ('club', 'zone', 'district'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Add entity_type and entity_id to announcements table  
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) CHECK (entity_type IN ('club', 'zone', 'district'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Create indexes for entity fields
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_announcements_entity ON announcements(entity_type, entity_id);

-- Update existing events to use club as entity (backward compatibility)
UPDATE events SET 
  entity_type = 'club',
  entity_id = club_id
WHERE entity_type IS NULL;

-- Update existing announcements to use club as entity (backward compatibility)
UPDATE announcements SET 
  entity_type = 'club',
  entity_id = club_id
WHERE entity_type IS NULL;

-- Make entity fields NOT NULL after setting default values
ALTER TABLE events ALTER COLUMN entity_type SET NOT NULL;
ALTER TABLE events ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE announcements ALTER COLUMN entity_type SET NOT NULL;
ALTER TABLE announcements ALTER COLUMN entity_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE events ADD CONSTRAINT fk_events_entity_club 
  FOREIGN KEY (entity_id) REFERENCES clubs(id) ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE events ADD CONSTRAINT fk_events_entity_zone 
  FOREIGN KEY (entity_id) REFERENCES zones(id) ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE events ADD CONSTRAINT fk_events_entity_district 
  FOREIGN KEY (entity_id) REFERENCES districts(id) ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE announcements ADD CONSTRAINT fk_announcements_entity_club 
  FOREIGN KEY (entity_id) REFERENCES clubs(id) ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE announcements ADD CONSTRAINT fk_announcements_entity_zone 
  FOREIGN KEY (entity_id) REFERENCES zones(id) ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE announcements ADD CONSTRAINT fk_announcements_entity_district 
  FOREIGN KEY (entity_id) REFERENCES districts(id) ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

-- Sample user permissions (for testing)
INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) VALUES 
  ('demo@example.com', 'club', (SELECT id FROM clubs WHERE name = 'Kinsmen Club of Brantford' LIMIT 1)),
  ('demo@example.com', 'zone', (SELECT id FROM zones WHERE name = 'Zone A' LIMIT 1)),
  ('demo@example.com', 'district', (SELECT id FROM districts WHERE name = 'District 1' LIMIT 1));
