# Kin Calendar Database Migration Guide

Follow these steps in order to update your Supabase database with the real Kin Canada club data:

## Step 1: Update Database Schema

Run this script first in your Supabase SQL Editor:

**File: `supabase-schema-update.sql`**

This script will:
- Add new columns to existing tables (province, zone_letter, city, club_type)
- Set default values for existing data
- Add proper constraints and indexes

## Step 2: Add Announcements and Image Storage

Run this script second:

**File: `supabase-migration.sql`**

This script will:
- Create the announcements table
- Set up image storage bucket
- Add sample announcement data
- Configure storage policies

## Step 3: Import Real Club Data

Run this script third:

**File: `supabase-complete-clubs-import.sql`**

This script will:
- Clear existing sample data
- Import all 111 real Kin Canada clubs
- Set up proper relationships between districts, zones, and clubs

## Migration Order

```sql
-- 1. Schema updates
-- Run: supabase-schema-update.sql

-- 2. Announcements and storage
-- Run: supabase-migration.sql

-- 3. Real club data
-- Run: supabase-complete-clubs-import.sql
```

## What You'll Get

After running all three scripts, you'll have:

- **2 Districts**: District 1, District 2 (Ontario)
- **16 Zones**: Zone A through Zone G
- **111 Clubs**: All real Kin Canada clubs with proper types
- **Announcements system**: With rich text editing and image uploads
- **Image storage**: Secure file hosting for uploaded images

## Verification

After migration, you can verify the data by running:

```sql
-- Check districts
SELECT * FROM districts;

-- Check zones
SELECT * FROM zones ORDER BY district_id, name;

-- Check clubs
SELECT c.name, c.city, c.club_type, z.name as zone, d.name as district 
FROM clubs c 
JOIN zones z ON c.zone_id = z.id 
JOIN districts d ON c.district_id = d.id 
ORDER BY d.name, z.name, c.name;

-- Check announcements
SELECT * FROM announcements;
```

## Troubleshooting

If you encounter errors:

1. **Column doesn't exist**: Make sure you ran Step 1 first
2. **Table already exists**: The scripts use `IF NOT EXISTS` and `ON CONFLICT` to handle this
3. **Permission errors**: Make sure you're running as the database owner

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove new columns (this will lose data)
ALTER TABLE districts DROP COLUMN IF EXISTS province;
ALTER TABLE zones DROP COLUMN IF EXISTS zone_letter;
ALTER TABLE clubs DROP COLUMN IF EXISTS city;
ALTER TABLE clubs DROP COLUMN IF EXISTS club_type;

-- Drop announcements table
DROP TABLE IF EXISTS announcements;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'images';
```
