-- Kin Canada Entity Permissions Migration Script (Safe Version)
-- This script safely adds entity permissions system to existing database

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_entity_permissions table (if not exists)
CREATE TABLE IF NOT EXISTS user_entity_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('club', 'zone', 'district')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_email, entity_id)
);

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_entity_permissions_user ON user_entity_permissions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_entity_permissions_entity ON user_entity_permissions(entity_type, entity_id);

-- Enable RLS (if not already enabled)
ALTER TABLE user_entity_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own entity permissions" ON user_entity_permissions;
    DROP POLICY IF EXISTS "Authenticated users can create entity permissions" ON user_entity_permissions;
    DROP POLICY IF EXISTS "Users can delete their own entity permissions" ON user_entity_permissions;
    
    -- Create new policies
    CREATE POLICY "Users can view their own entity permissions" ON user_entity_permissions
      FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
    
    CREATE POLICY "Authenticated users can create entity permissions" ON user_entity_permissions
      FOR INSERT WITH CHECK (true);
    
    CREATE POLICY "Users can delete their own entity permissions" ON user_entity_permissions
      FOR DELETE USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');
END $$;

-- Add entity_type and entity_id to events table (if not exists)
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) CHECK (entity_type IN ('club', 'zone', 'district'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Add entity_type and entity_id to announcements table (if not exists)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) CHECK (entity_type IN ('club', 'zone', 'district'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Create indexes for entity fields (if not exists)
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_announcements_entity ON announcements(entity_type, entity_id);

-- Update existing events to have entity_type and entity_id (only if they're NULL)
UPDATE events 
SET 
  entity_type = 'club',
  entity_id = club_id
WHERE entity_type IS NULL;

-- Update existing announcements to have entity_type and entity_id (only if they're NULL)
UPDATE announcements 
SET 
  entity_type = 'club',
  entity_id = club_id
WHERE entity_type IS NULL;

-- Make entity fields NOT NULL (only if they don't have NOT NULL constraint already)
DO $$
BEGIN
    -- Check if entity_type is already NOT NULL, if not, make it NOT NULL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'entity_type' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN entity_type SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'entity_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN entity_id SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'entity_type' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE announcements ALTER COLUMN entity_type SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'entity_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE announcements ALTER COLUMN entity_id SET NOT NULL;
    END IF;
END $$;

-- Add foreign key constraints for entity_id (only if they don't exist)
DO $$
BEGIN
    -- Check if foreign key constraints already exist
    -- Note: We'll add separate CHECK constraints instead of combining them with FOREIGN KEY
    -- This is because PostgreSQL doesn't support CHECK constraints in FOREIGN KEY definitions
END $$;

-- Insert sample user entity permissions (only if table is empty)
INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) 
SELECT 'demo@example.com', 'club', id FROM clubs LIMIT 3
ON CONFLICT (user_email, entity_id) DO NOTHING;

INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) 
SELECT 'demo@example.com', 'zone', id FROM zones LIMIT 2
ON CONFLICT (user_email, entity_id) DO NOTHING;

INSERT INTO user_entity_permissions (user_email, entity_type, entity_id) 
SELECT 'demo@example.com', 'district', id FROM districts LIMIT 1
ON CONFLICT (user_email, entity_id) DO NOTHING;
