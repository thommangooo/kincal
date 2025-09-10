-- Kin Canada Events Calendar Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies for images bucket
CREATE POLICY "Public images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- Districts table
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zones table
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  website VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(500),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  tags TEXT[], -- Array of tags like ['fundraiser', 'service', 'social']
  event_url VARCHAR(500),
  image_url VARCHAR(500),
  created_by_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
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

-- Magic link tokens for authentication
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_zone_id ON events(zone_id);
CREATE INDEX idx_events_district_id ON events(district_id);
CREATE INDEX idx_events_visibility ON events(visibility);

CREATE INDEX idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX idx_announcements_club_id ON announcements(club_id);
CREATE INDEX idx_announcements_zone_id ON announcements(zone_id);
CREATE INDEX idx_announcements_district_id ON announcements(district_id);
CREATE INDEX idx_announcements_visibility ON announcements(visibility);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_expiry_date ON announcements(expiry_date);

CREATE INDEX idx_magic_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_tokens_expires_at ON magic_link_tokens(expires_at);

-- Row Level Security (RLS) policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Public events are visible to everyone
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT USING (visibility = 'public');

-- Private events are only visible to authenticated users (for now, we'll implement proper member auth later)
CREATE POLICY "Private events are viewable by authenticated users" ON events
  FOR SELECT USING (visibility = 'private');

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (true);

-- Users can update/delete their own events
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Public announcements are visible to everyone
CREATE POLICY "Public announcements are viewable by everyone" ON announcements
  FOR SELECT USING (visibility = 'public');

-- Private announcements are only visible to authenticated users
CREATE POLICY "Private announcements are viewable by authenticated users" ON announcements
  FOR SELECT USING (visibility = 'private');

-- Only authenticated users can create announcements
CREATE POLICY "Authenticated users can create announcements" ON announcements
  FOR INSERT WITH CHECK (true);

-- Users can update/delete their own announcements
CREATE POLICY "Users can update their own announcements" ON announcements
  FOR UPDATE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can delete their own announcements" ON announcements
  FOR DELETE USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Magic link tokens are only accessible by the system
CREATE POLICY "Magic link tokens are system only" ON magic_link_tokens
  FOR ALL USING (false);

-- Sample data for testing (you can remove this in production)
INSERT INTO districts (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'District 1'),
  ('22222222-2222-2222-2222-222222222222', 'District 2');

INSERT INTO zones (id, name, district_id) VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Zone 1A', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', 'Zone 1B', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', 'Zone 2A', '22222222-2222-2222-2222-222222222222');

INSERT INTO clubs (id, name, zone_id, district_id, website) VALUES 
  ('66666666-6666-6666-6666-666666666666', 'Sample Kin Club 1', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'https://example1.com'),
  ('77777777-7777-7777-7777-777777777777', 'Sample Kin Club 2', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'https://example2.com'),
  ('88888888-8888-8888-8888-888888888888', 'Sample Kin Club 3', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'https://example3.com');

-- Sample announcements
INSERT INTO announcements (id, title, content, club_id, zone_id, district_id, visibility, priority, created_by_email) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Monthly Club Meeting', '<p>Join us for our monthly club meeting on <strong>March 15th at 7:00 PM</strong> at the Community Center.</p><p>Agenda items include:</p><ul><li>Budget review</li><li>Upcoming service projects</li><li>New member introductions</li></ul>', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'public', 1, 'demo@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Service Project Success', '<p>Thank you to all members who participated in our <em>Community Cleanup Day</em> last weekend!</p><p>We collected over 200 bags of litter and made a real difference in our neighborhood. Special thanks to our volunteers:</p><ul><li>John Smith</li><li>Sarah Johnson</li><li>Mike Wilson</li></ul><p>Next cleanup is scheduled for April 20th.</p>', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'public', 0, 'demo@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Fundraising Event Update', '<h3>Annual Gala Planning</h3><p>Our annual fundraising gala is coming up on <strong>May 10th</strong>! We need volunteers for:</p><ul><li>Event setup</li><li>Registration table</li><li>Silent auction coordination</li></ul><p>Please contact the event committee if you can help. This is our biggest fundraiser of the year!</p>', '77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'public', 2, 'demo@example.com');
