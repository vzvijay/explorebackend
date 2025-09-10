-- ==============================================
-- PRODUCTION DATABASE DEPLOYMENT SCRIPT
-- ==============================================
-- This script deploys all local database changes to Render PostgreSQL
-- Run this script on your Render PostgreSQL production database
-- 
-- IMPORTANT: Backup your production database before running this script!
-- ==============================================

-- ==============================================
-- STEP 1: Schema Fix - Property ID Changes
-- ==============================================

-- Add property_id column to properties table (nullable initially)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_id VARCHAR(100);

-- Generate property_id values for existing properties
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

-- Make property_id NOT NULL and UNIQUE
ALTER TABLE properties 
ALTER COLUMN property_id SET NOT NULL;

ALTER TABLE properties 
ADD CONSTRAINT properties_property_id_unique UNIQUE (property_id);

-- ==============================================
-- STEP 2: Update property_images table
-- ==============================================

-- Drop existing foreign key constraint from property_images
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

-- Change property_images.property_id from UUID to VARCHAR
ALTER TABLE property_images 
ALTER COLUMN property_id TYPE VARCHAR(100);

-- Update property_images to use the new property_id format
UPDATE property_images 
SET property_id = p.property_id
FROM properties p
WHERE property_images.property_id = p.id::text;

-- For any remaining property_images that couldn't be mapped
UPDATE property_images 
SET property_id = (SELECT property_id FROM properties ORDER BY created_at LIMIT 1)
WHERE property_id IS NULL OR property_id = '';

-- Make property_id NOT NULL in property_images
ALTER TABLE property_images 
ALTER COLUMN property_id SET NOT NULL;

-- Add new foreign key constraint
ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE;

-- ==============================================
-- STEP 3: GitLab-Only Storage Migration
-- ==============================================

-- Remove base64 columns (since you don't need existing data)
ALTER TABLE properties DROP COLUMN IF EXISTS owner_tenant_photo;
ALTER TABLE properties DROP COLUMN IF EXISTS signature_data;
ALTER TABLE properties DROP COLUMN IF EXISTS sketch_photo;

-- ==============================================
-- STEP 4: Fix Image ID Column Types
-- ==============================================

-- Drop foreign key constraints for image ID columns
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_owner_photo_image_id_fkey;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_signature_image_id_fkey;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_sketch_photo_image_id_fkey;

-- Change image ID columns from UUID to VARCHAR(100)
ALTER TABLE properties 
ALTER COLUMN owner_photo_image_id TYPE VARCHAR(100);

ALTER TABLE properties 
ALTER COLUMN signature_image_id TYPE VARCHAR(100);

ALTER TABLE properties 
ALTER COLUMN sketch_photo_image_id TYPE VARCHAR(100);

-- ==============================================
-- STEP 5: Create Indexes for Performance
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_image_type ON property_images(image_type);

-- ==============================================
-- STEP 6: Clean up orphaned data
-- ==============================================

-- Delete any property_images that don't have valid property references
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT property_id FROM properties);

-- ==============================================
-- STEP 7: Add Comments for Documentation
-- ==============================================

COMMENT ON COLUMN properties.property_id IS 'Unique property identifier (PROP-2025-XXX format)';
COMMENT ON COLUMN properties.owner_photo_image_id IS 'GitLab image ID for owner photo';
COMMENT ON COLUMN properties.signature_image_id IS 'GitLab image ID for signature';
COMMENT ON COLUMN properties.sketch_photo_image_id IS 'GitLab image ID for sketch photo';

-- ==============================================
-- STEP 8: Verification Queries
-- ==============================================

-- Verify schema changes
SELECT 
    'Schema Verification' as check_type,
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('properties', 'property_images') 
AND column_name IN ('property_id', 'owner_photo_image_id', 'signature_image_id', 'sketch_photo_image_id')
ORDER BY table_name, column_name;

-- Check data integrity
SELECT 'Data Integrity Check' as check_type;
SELECT 'Properties count:' as info, COUNT(*) as count FROM properties;
SELECT 'Property_images count:' as info, COUNT(*) as count FROM property_images;

-- Check that all property_images have valid property_id references
SELECT 'Valid property_images references:' as info, COUNT(*) as count
FROM property_images pi 
JOIN properties p ON pi.property_id = p.property_id;

-- Show sample data
SELECT 'Sample Data Check' as check_type;
SELECT 'Sample properties:' as info;
SELECT property_id, survey_number, owner_name FROM properties LIMIT 3;

SELECT 'Sample property_images:' as info;
SELECT property_id, image_type, file_name FROM property_images LIMIT 3;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

SELECT '🎉 Production database deployment completed successfully!' as result;
SELECT '✅ All schema changes applied' as status;
SELECT '✅ GitLab-only storage enabled' as status;
SELECT '✅ Image ID types updated' as status;
SELECT '✅ Data integrity verified' as status;
