-- Kin Canada Entity Migration
-- This script adds support for Kin Canada as an independent entity type

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create kin_canada table (single row table for the Kin Canada entity)
CREATE TABLE IF NOT EXISTS kin_canada (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL DEFAULT 'Kin Canada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the single Kin Canada entity if it doesn't exist
INSERT INTO kin_canada (id, name)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, 'Kin Canada'
WHERE NOT EXISTS (SELECT 1 FROM kin_canada WHERE id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Make club_id, zone_id, district_id nullable in events table (if not already)
ALTER TABLE events ALTER COLUMN club_id DROP NOT NULL;
ALTER TABLE events ALTER COLUMN zone_id DROP NOT NULL;
ALTER TABLE events ALTER COLUMN district_id DROP NOT NULL;

-- Add kin_canada_id column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS kin_canada_id UUID REFERENCES kin_canada(id) ON DELETE CASCADE;

-- Create index for kin_canada_id
CREATE INDEX IF NOT EXISTS idx_events_kin_canada_id ON events(kin_canada_id);

-- Update entity_type constraint to include 'kin_canada'
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_entity_type_check;
ALTER TABLE events ADD CONSTRAINT events_entity_type_check 
  CHECK (entity_type IN ('club', 'zone', 'district', 'kin_canada'));

-- Make club_id, zone_id, district_id nullable in announcements table (if not already)
ALTER TABLE announcements ALTER COLUMN club_id DROP NOT NULL;
ALTER TABLE announcements ALTER COLUMN zone_id DROP NOT NULL;
ALTER TABLE announcements ALTER COLUMN district_id DROP NOT NULL;

-- Add kin_canada_id column to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS kin_canada_id UUID REFERENCES kin_canada(id) ON DELETE CASCADE;

-- Create index for kin_canada_id in announcements
CREATE INDEX IF NOT EXISTS idx_announcements_kin_canada_id ON announcements(kin_canada_id);

-- Update entity_type constraint in announcements to include 'kin_canada'
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_entity_type_check;
ALTER TABLE announcements ADD CONSTRAINT announcements_entity_type_check 
  CHECK (entity_type IN ('club', 'zone', 'district', 'kin_canada'));

-- Update entity_type constraint in user_entity_permissions to include 'kin_canada'
ALTER TABLE user_entity_permissions DROP CONSTRAINT IF EXISTS user_entity_permissions_entity_type_check;
ALTER TABLE user_entity_permissions ADD CONSTRAINT user_entity_permissions_entity_type_check 
  CHECK (entity_type IN ('club', 'zone', 'district', 'kin_canada'));

-- Update entity_type constraint in editor_requests to include 'kin_canada' (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'editor_requests') THEN
    ALTER TABLE editor_requests DROP CONSTRAINT IF EXISTS editor_requests_entity_type_check;
    ALTER TABLE editor_requests ADD CONSTRAINT editor_requests_entity_type_check 
      CHECK (entity_type IN ('club', 'zone', 'district', 'kin_canada'));
  END IF;
END $$;

-- Update entity_type constraint in social_media_accounts to include 'kin_canada' (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_media_accounts') THEN
    ALTER TABLE social_media_accounts DROP CONSTRAINT IF EXISTS social_media_accounts_entity_type_check;
    ALTER TABLE social_media_accounts ADD CONSTRAINT social_media_accounts_entity_type_check 
      CHECK (entity_type IN ('club', 'zone', 'district', 'kin_canada'));
  END IF;
END $$;

-- Add foreign key constraints for entity_id when entity_type is 'kin_canada'
-- Note: This needs to be deferred because entity_id can reference different tables
DO $$
BEGIN
  -- Remove existing constraints if they exist
  ALTER TABLE events DROP CONSTRAINT IF EXISTS fk_events_entity_kin_canada;
  ALTER TABLE announcements DROP CONSTRAINT IF EXISTS fk_announcements_entity_kin_canada;
  
  -- Add new constraints (these will be enforced by application logic)
  -- We don't add FK constraints here because entity_id can point to different tables
  -- based on entity_type, which is handled at the application level
END $$;

-- Enable RLS on kin_canada table
ALTER TABLE kin_canada ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kin_canada table
CREATE POLICY "Kin Canada is viewable by everyone" ON kin_canada
  FOR SELECT USING (true);

-- Only superusers can modify Kin Canada entity
CREATE POLICY "Only superusers can modify Kin Canada" ON kin_canada
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM approved_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'superuser'
    )
  );

