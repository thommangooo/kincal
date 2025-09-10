-- Kin Canada Schema Update Script
-- This script updates the existing database schema to match the real club data structure

-- Add new columns to existing tables
ALTER TABLE districts ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE zones ADD COLUMN IF NOT EXISTS zone_letter VARCHAR(10);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS club_type VARCHAR(50);

-- Update existing sample data to have default values
UPDATE districts SET province = 'Ontario' WHERE province IS NULL;
UPDATE zones SET zone_letter = 'A' WHERE zone_letter IS NULL;
UPDATE clubs SET city = 'Sample City' WHERE city IS NULL;
UPDATE clubs SET club_type = 'Kin' WHERE club_type IS NULL;

-- Make the new columns NOT NULL after setting default values
ALTER TABLE districts ALTER COLUMN province SET NOT NULL;
ALTER TABLE clubs ALTER COLUMN city SET NOT NULL;
ALTER TABLE clubs ALTER COLUMN club_type SET NOT NULL;

-- Add constraints for club_type
ALTER TABLE clubs ADD CONSTRAINT check_club_type CHECK (club_type IN ('Kinsmen', 'Kinette', 'Kin'));

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_clubs_city ON clubs(city);
CREATE INDEX IF NOT EXISTS idx_clubs_club_type ON clubs(club_type);
CREATE INDEX IF NOT EXISTS idx_zones_zone_letter ON zones(zone_letter);
CREATE INDEX IF NOT EXISTS idx_districts_province ON districts(province);
