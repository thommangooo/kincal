-- Fix foreign key constraints for editor_requests table
-- The issue is that we can't have multiple foreign keys on the same column

-- Drop the existing foreign key constraints
ALTER TABLE editor_requests DROP CONSTRAINT IF EXISTS fk_editor_requests_club;
ALTER TABLE editor_requests DROP CONSTRAINT IF EXISTS fk_editor_requests_zone;
ALTER TABLE editor_requests DROP CONSTRAINT IF EXISTS fk_editor_requests_district;

-- Add a check constraint to ensure entity_type matches a valid type
-- and that the entity_id exists in the appropriate table
-- We'll handle this validation in the application layer instead

-- Note: We're removing the foreign key constraints because:
-- 1. PostgreSQL doesn't support conditional foreign keys easily
-- 2. We have multiple entity types (club, zone, district) in one column
-- 3. Application-level validation is more flexible for this use case

-- The application will validate that the entity_id exists in the correct table
-- based on the entity_type before inserting the request
