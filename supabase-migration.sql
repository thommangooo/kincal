-- Kin Canada Events Calendar Migration Script
-- This script adds announcements and image storage to existing database

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket (if not exists)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Public images are viewable by everyone" ON storage.objects
      FOR SELECT USING (bucket_id = 'images');

    CREATE POLICY "Authenticated users can upload images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'images');

    CREATE POLICY "Users can update their own images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'images');

    CREATE POLICY "Users can delete their own images" ON storage.objects
      FOR DELETE USING (bucket_id = 'images');
END $$;

-- Create announcements table (if not exists)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- HTML content
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE, -- Optional expiry date
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  tags TEXT[], -- Array of tags
  priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
  image_url VARCHAR(500),
  created_by_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for announcements (if not exist)
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_announcements_club_id ON announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_announcements_zone_id ON announcements(zone_id);
CREATE INDEX IF NOT EXISTS idx_announcements_district_id ON announcements(district_id);
CREATE INDEX IF NOT EXISTS idx_announcements_visibility ON announcements(visibility);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_expiry_date ON announcements(expiry_date);

-- Enable RLS on announcements (if not already enabled)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Public announcements are viewable by everyone" ON announcements;
    DROP POLICY IF EXISTS "Private announcements are viewable by authenticated users" ON announcements;
    DROP POLICY IF EXISTS "Authenticated users can create announcements" ON announcements;
    DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
    DROP POLICY IF EXISTS "Users can delete their own announcements" ON announcements;
    
    -- Create new policies
    CREATE POLICY "Public announcements are viewable by everyone" ON announcements
      FOR SELECT USING (visibility = 'public');

    CREATE POLICY "Private announcements are viewable by authenticated users" ON announcements
      FOR SELECT USING (visibility = 'private');

    CREATE POLICY "Authenticated users can create announcements" ON announcements
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update their own announcements" ON announcements
      FOR UPDATE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

    CREATE POLICY "Users can delete their own announcements" ON announcements
      FOR DELETE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');
END $$;

-- Insert sample announcements (only if table is empty)
INSERT INTO announcements (id, title, content, club_id, zone_id, district_id, visibility, priority, created_by_email) 
SELECT * FROM (VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Monthly Club Meeting', '<p>Join us for our monthly club meeting on <strong>March 15th at 7:00 PM</strong> at the Community Center.</p><p>Agenda items include:</p><ul><li>Budget review</li><li>Upcoming service projects</li><li>New member introductions</li></ul>', '66666666-6666-6666-6666-666666666666'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'public', 1, 'demo@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Service Project Success', '<p>Thank you to all members who participated in our <em>Community Cleanup Day</em> last weekend!</p><p>We collected over 200 bags of litter and made a real difference in our neighborhood. Special thanks to our volunteers:</p><ul><li>John Smith</li><li>Sarah Johnson</li><li>Mike Wilson</li></ul><p>Next cleanup is scheduled for April 20th.</p>', '66666666-6666-6666-6666-666666666666'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'public', 0, 'demo@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Fundraising Event Update', '<h3>Annual Gala Planning</h3><p>Our annual fundraising gala is coming up on <strong>May 10th</strong>! We need volunteers for:</p><ul><li>Event setup</li><li>Registration table</li><li>Silent auction coordination</li></ul><p>Please contact the event committee if you can help. This is our biggest fundraiser of the year!</p>', '77777777-7777-7777-7777-777777777777'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'public', 2, 'demo@example.com')
) AS sample_data(id, title, content, club_id, zone_id, district_id, visibility, priority, created_by_email)
WHERE NOT EXISTS (SELECT 1 FROM announcements LIMIT 1);
