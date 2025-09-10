-- Fix Foreign Key Constraints for Entity System
-- This script removes problematic foreign key constraints that are causing conflicts

-- First, let's see what constraints exist
-- (This is just for reference - we'll remove the problematic ones)

-- Remove any existing foreign key constraints that might be causing issues
DO $$
BEGIN
    -- Drop foreign key constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_events_entity_zone'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT fk_events_entity_zone;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_events_entity_club'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT fk_events_entity_club;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_events_entity_district'
    ) THEN
        ALTER TABLE events DROP CONSTRAINT fk_events_entity_district;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_announcements_entity_zone'
    ) THEN
        ALTER TABLE announcements DROP CONSTRAINT fk_announcements_entity_zone;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_announcements_entity_club'
    ) THEN
        ALTER TABLE announcements DROP CONSTRAINT fk_announcements_entity_club;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_announcements_entity_district'
    ) THEN
        ALTER TABLE announcements DROP CONSTRAINT fk_announcements_entity_district;
    END IF;
END $$;

-- Ensure the entity columns exist and are properly set
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) CHECK (entity_type IN ('club', 'zone', 'district'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_id UUID;

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) CHECK (entity_type IN ('club', 'zone', 'district'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Update existing records to have proper entity values
UPDATE events 
SET 
  entity_type = 'club',
  entity_id = club_id
WHERE entity_type IS NULL OR entity_id IS NULL;

UPDATE announcements 
SET 
  entity_type = 'club',
  entity_id = club_id
WHERE entity_type IS NULL OR entity_id IS NULL;

-- Make sure the columns are NOT NULL
ALTER TABLE events ALTER COLUMN entity_type SET NOT NULL;
ALTER TABLE events ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE announcements ALTER COLUMN entity_type SET NOT NULL;
ALTER TABLE announcements ALTER COLUMN entity_id SET NOT NULL;
