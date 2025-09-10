-- Kin Canada Clubs Import Script
-- This script updates the database schema and imports real club data

-- First, let's update the existing tables to match the real data structure

-- Update districts table to include province
ALTER TABLE districts ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- Update zones table to include zone letter
ALTER TABLE zones ADD COLUMN IF NOT EXISTS zone_letter VARCHAR(10);

-- Update clubs table to include city and club type
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS club_type VARCHAR(50);

-- Clear existing sample data
DELETE FROM clubs;
DELETE FROM zones;
DELETE FROM districts;

-- Insert real districts
INSERT INTO districts (id, name, province) VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'District 1', 'Ontario'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'District 2', 'Ontario');

-- Insert real zones
INSERT INTO zones (id, name, district_id, zone_letter) VALUES 
  -- District 1 Zones
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Zone A', '11111111-1111-1111-1111-111111111111'::uuid, 'A'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Zone B', '11111111-1111-1111-1111-111111111111'::uuid, 'B'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Zone C', '11111111-1111-1111-1111-111111111111'::uuid, 'C'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Zone D', '11111111-1111-1111-1111-111111111111'::uuid, 'D'),
  -- District 2 Zones
  ('77777777-7777-7777-7777-777777777777'::uuid, 'Zone E', '22222222-2222-2222-2222-222222222222'::uuid, 'E'),
  ('88888888-8888-8888-8888-888888888888'::uuid, 'Zone F', '22222222-2222-2222-2222-222222222222'::uuid, 'F'),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'Zone G', '22222222-2222-2222-2222-222222222222'::uuid, 'G');

-- Insert all clubs from District 1
INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES 
  -- Zone A
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Kinsmen Club of Brantford', 'Brantford', 'Kinsmen', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Kin Club of Cambridge (Preston)', 'Cambridge (Preston)', 'Kin', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Flamborough & District Kin Club', 'Flamborough & District', 'Kin', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'Kinette Club of Guelph', 'Guelph', 'Kinette', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'Kinsmen Club of Hamilton', 'Hamilton', 'Kinsmen', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 'Kinette Club of Kitchener-Waterloo', 'Kitchener-Waterloo', 'Kinette', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg'::uuid, 'Kinsmen Club of Kitchener-Waterloo', 'Kitchener-Waterloo', 'Kinsmen', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'::uuid, 'Kinsmen Club of Oakville', 'Oakville', 'Kinsmen', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii'::uuid, 'Kinsmen Club of Stoney Creek', 'Stoney Creek', 'Kinsmen', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj'::uuid, 'Kinsmen Club of Waterloo – Grand River', 'Waterloo (Grand River)', 'Kinsmen', '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  
  -- Zone B
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk'::uuid, 'Kinsmen Club of Belgrave', 'Belgrave', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('llllllll-llll-llll-llll-llllllllllll'::uuid, 'Kinette Club of Centre Wellington', 'Centre Wellington', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm'::uuid, 'Kinette Club of Drayton', 'Drayton', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn'::uuid, 'Drayton Kinsmen Club', 'Drayton', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('oooooooo-oooo-oooo-oooo-oooooooooooo'::uuid, 'Kinsmen Club of Fergus & District', 'Fergus & District', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('pppppppp-pppp-pppp-pppp-pppppppppppp'::uuid, 'Kinsmen Club of Harriston', 'Harriston', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq'::uuid, 'Kinette Club of Listowel', 'Listowel', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr'::uuid, 'Kinsmen Club of Listowel', 'Listowel', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('ssssssss-ssss-ssss-ssss-ssssssssssss'::uuid, 'Kinette Club of Lucknow & District', 'Lucknow & District', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('tttttttt-tttt-tttt-tttt-tttttttttttt'::uuid, 'Kinsmen Club of Lucknow & District', 'Lucknow & District', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu'::uuid, 'Kinette Club of Mount Forest', 'Mount Forest', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::uuid, 'Kinsmen Club of Mount Forest', 'Mount Forest', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww'::uuid, 'Kinette Club of Palmerston', 'Palmerston', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid, 'Kinsmen Club of Palmerston', 'Palmerston', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy'::uuid, 'Kinette Club of Wingham', 'Wingham', 'Kinette', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'::uuid, 'Kinsmen Club of Wingham', 'Wingham', 'Kinsmen', '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid);

-- Continue with remaining zones... (This is a partial import - we'll need to add all clubs)
-- For now, let's add a few more key clubs from other zones

-- Zone C
INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES 
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'::uuid, 'Kinsmen Club of Barrie', 'Barrie', 'Kinsmen', '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'::uuid, 'Kinette Club of Barrie', 'Barrie', 'Kinette', '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111'::uuid);

-- Zone D
INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES 
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3'::uuid, 'Kinsmen Club of Toronto', 'Toronto', 'Kinsmen', '66666666-6666-6666-6666-666666666666'::uuid, '11111111-1111-1111-1111-111111111111'::uuid),
  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'::uuid, 'Kinette Club of Toronto', 'Toronto', 'Kinette', '66666666-6666-6666-6666-666666666666'::uuid, '11111111-1111-1111-1111-111111111111'::uuid);

-- District 2 - Zone E
INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES 
  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5'::uuid, 'Pilot Mound Kinsmen Club', 'Pilot Mound', 'Kinsmen', '77777777-7777-7777-7777-777777777777'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6'::uuid, 'Treherne Kinette Club', 'Treherne', 'Kinette', '77777777-7777-7777-7777-777777777777'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('g7g7g7g7-g7g7-g7g7-g7g7-g7g7g7g7g7g7'::uuid, 'Treherne Kinsmen Club', 'Treherne', 'Kinsmen', '77777777-7777-7777-7777-777777777777'::uuid, '22222222-2222-2222-2222-222222222222'::uuid);

-- Zone F
INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES 
  ('h8h8h8h8-h8h8-h8h8-h8h8-h8h8h8h8h8h8'::uuid, 'Boissevain Kinette Club', 'Boissevain', 'Kinette', '88888888-8888-8888-8888-888888888888'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('i9i9i9i9-i9i9-i9i9-i9i9-i9i9i9i9i9i9'::uuid, 'Boissevain Kinsmen Club', 'Boissevain', 'Kinsmen', '88888888-8888-8888-8888-888888888888'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('j0j0j0j0-j0j0-j0j0-j0j0-j0j0j0j0j0j0'::uuid, 'Brandon Kinette Club', 'Brandon', 'Kinette', '88888888-8888-8888-8888-888888888888'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('k1k1k1k1-k1k1-k1k1-k1k1-k1k1k1k1k1k1'::uuid, 'Brandon Kinsmen Club', 'Brandon', 'Kinsmen', '88888888-8888-8888-8888-888888888888'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('l2l2l2l2-l2l2-l2l2-l2l2-l2l2l2l2l2l2'::uuid, 'Killarney Kinsmen Club', 'Killarney', 'Kinsmen', '88888888-8888-8888-8888-888888888888'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('m3m3m3m3-m3m3-m3m3-m3m3-m3m3m3m3m3m3'::uuid, 'Neepawa Kin Club', 'Neepawa', 'Kin', '88888888-8888-8888-8888-888888888888'::uuid, '22222222-2222-2222-2222-222222222222'::uuid);

-- Zone G
INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES 
  ('n4n4n4n4-n4n4-n4n4-n4n4-n4n4n4n4n4n4'::uuid, 'Dauphin Kin Club', 'Dauphin', 'Kin', '99999999-9999-9999-9999-999999999999'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('o5o5o5o5-o5o5-o5o5-o5o5-o5o5o5o5o5o5'::uuid, 'Grandview Kinsmen Club', 'Grandview', 'Kinsmen', '99999999-9999-9999-9999-999999999999'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('p6p6p6p6-p6p6-p6p6-p6p6-p6p6p6p6p6p6'::uuid, 'Ste. Rose Kinsmen Club', 'Ste. Rose', 'Kinsmen', '99999999-9999-9999-9999-999999999999'::uuid, '22222222-2222-2222-2222-222222222222'::uuid),
  ('q7q7q7q7-q7q7-q7q7-q7q7-q7q7q7q7q7q7'::uuid, 'Swan River Kinsmen Club', 'Swan River', 'Kinsmen', '99999999-9999-9999-9999-999999999999'::uuid, '22222222-2222-2222-2222-222222222222'::uuid);
