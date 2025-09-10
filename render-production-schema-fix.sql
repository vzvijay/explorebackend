-- Render PostgreSQL Production Schema Fix
-- This script aligns the production database with the Sequelize models
-- Run these queries in order on your Render PostgreSQL database

-- ==============================================
-- STEP 1: Add property_id column to properties table
-- ==============================================

-- First, add property_id column to properties table (nullable initially)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_id VARCHAR(100);

-- ==============================================
-- STEP 2: Generate property_id values for existing properties
-- ==============================================

-- Generate property_id values for existing properties using a pattern like PROP-2025-001, PROP-2025-002, etc.
-- Using a sequence-based approach for production safety
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM properties ORDER BY created_at LOOP
        UPDATE properties 
        SET property_id = 'PROP-2025-' || LPAD(counter::text, 3, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- ==============================================
-- STEP 3: Make property_id NOT NULL and UNIQUE
-- ==============================================

-- Make property_id NOT NULL
ALTER TABLE properties 
ALTER COLUMN property_id SET NOT NULL;

-- Add unique constraint
ALTER TABLE properties 
ADD CONSTRAINT properties_property_id_unique UNIQUE (property_id);

-- ==============================================
-- STEP 4: Update property_images table
-- ==============================================

-- Drop existing foreign key constraint from property_images
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

-- Change property_images.property_id from UUID to VARCHAR
ALTER TABLE property_images 
ALTER COLUMN property_id TYPE VARCHAR(100);

-- ==============================================
-- STEP 5: Handle existing property_images data
-- ==============================================

-- Update property_images to use the new property_id format
-- Map the old UUID property_id to the new string property_id
UPDATE property_images 
SET property_id = p.property_id
FROM properties p
WHERE property_images.property_id = p.id::text;

-- For any remaining property_images that couldn't be mapped, 
-- assign them to the first property (temporary solution)
UPDATE property_images 
SET property_id = (SELECT property_id FROM properties ORDER BY created_at LIMIT 1)
WHERE property_id IS NULL OR property_id = '';

-- Make property_id NOT NULL in property_images
ALTER TABLE property_images 
ALTER COLUMN property_id SET NOT NULL;

-- ==============================================
-- STEP 6: Add new foreign key constraint
-- ==============================================

-- Add new foreign key constraint
ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE;

-- ==============================================
-- STEP 7: Create indexes for better performance
-- ==============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- ==============================================
-- STEP 8: Clean up any orphaned property_images
-- ==============================================

-- Delete any property_images that don't have valid property references
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT property_id FROM properties);

-- ==============================================
-- STEP 9: Verification queries
-- ==============================================

-- Verify the changes
SELECT 
    'properties' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'property_id'

UNION ALL

SELECT 
    'property_images' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'property_images' AND column_name = 'property_id';

-- Check data integrity
SELECT 'Properties count:' as info, COUNT(*) as count FROM properties;
SELECT 'Property_images count:' as info, COUNT(*) as count FROM property_images;

-- Check that all property_images have valid property_id references
SELECT 'Valid property_images references:' as info, COUNT(*) as count
FROM property_images pi 
JOIN properties p ON pi.property_id = p.property_id;

-- Show sample data
SELECT 'Sample properties:' as info;
SELECT property_id, survey_number, owner_name FROM properties LIMIT 3;

SELECT 'Sample property_images:' as info;
SELECT property_id, image_type, file_name FROM property_images LIMIT 3;

-- Success message
SELECT 'Production schema fix completed successfully!' as result;
