-- Kin Canada Events Calendar - Events Table Migration
-- This script creates the events table and related structures

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create events table (if not exists)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIME, -- Optional specific start time
  end_time TIME,   -- Optional specific end time
  location VARCHAR(500),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('club', 'zone', 'district')),
  entity_id UUID NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  tags TEXT[], -- Array of tags
  event_url VARCHAR(500),
  image_url VARCHAR(500),
  created_by_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for events (if not exist)
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_zone_id ON events(zone_id);
CREATE INDEX IF NOT EXISTS idx_events_district_id ON events(district_id);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_created_by_email ON events(created_by_email);

-- Enable RLS on events (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
    DROP POLICY IF EXISTS "Private events are viewable by authenticated users" ON events;
    DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
    DROP POLICY IF EXISTS "Users can update their own events" ON events;
    DROP POLICY IF EXISTS "Users can delete their own events" ON events;
    
    -- Create new policies
    CREATE POLICY "Public events are viewable by everyone" ON events
      FOR SELECT USING (visibility = 'public');

    CREATE POLICY "Private events are viewable by authenticated users" ON events
      FOR SELECT USING (visibility = 'private');

    CREATE POLICY "Authenticated users can create events" ON events
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update their own events" ON events
      FOR UPDATE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

    CREATE POLICY "Users can delete their own events" ON events
      FOR DELETE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');
END $$;

-- Insert sample events (only if table is empty)
INSERT INTO events (id, title, description, start_date, end_date, location, club_id, zone_id, district_id, entity_type, entity_id, visibility, tags, event_url, created_by_email) 
SELECT * FROM (VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Monthly Club Meeting', 'Join us for our monthly club meeting to discuss upcoming events and community service projects.', '2024-03-15 19:00:00+00'::timestamptz, '2024-03-15 21:00:00+00'::timestamptz, 'Community Center, Main Hall', '66666666-6666-6666-6666-666666666666'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'club', '66666666-6666-6666-6666-666666666666'::uuid, 'public', ARRAY['meeting', 'monthly'], 'https://example.com/meeting', 'demo@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Community Cleanup Day', 'Help us clean up the local park and make our community beautiful!', '2024-03-20 09:00:00+00'::timestamptz, '2024-03-20 15:00:00+00'::timestamptz, 'Riverside Park', '66666666-6666-6666-6666-666666666666'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'club', '66666666-6666-6666-6666-666666666666'::uuid, 'public', ARRAY['service', 'community', 'cleanup'], NULL, 'demo@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Annual Fundraising Gala', 'Our biggest fundraising event of the year! Join us for dinner, dancing, and silent auction.', '2024-05-10 18:00:00+00'::timestamptz, '2024-05-10 23:00:00+00'::timestamptz, 'Grand Hotel Ballroom', '77777777-7777-7777-7777-777777777777'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'club', '77777777-7777-7777-7777-777777777777'::uuid, 'public', ARRAY['fundraising', 'gala', 'dinner'], 'https://example.com/gala', 'demo@example.com')
) AS sample_data(id, title, description, start_date, end_date, location, club_id, zone_id, district_id, entity_type, entity_id, visibility, tags, event_url, created_by_email)
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1);
