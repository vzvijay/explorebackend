-- Migration: GitLab-Only Storage
-- This script removes base64 columns and prepares for GitLab-only image storage
-- Run this on your local database first

-- Step 1: Remove base64 columns (since you don't need existing data)
ALTER TABLE properties DROP COLUMN IF EXISTS owner_tenant_photo;
ALTER TABLE properties DROP COLUMN IF EXISTS signature_data;
ALTER TABLE properties DROP COLUMN IF EXISTS sketch_photo;

-- Step 2: Verify GitLab image ID columns exist and are correct
-- (These should already exist from your previous schema fix)
-- owner_photo_image_id, signature_image_id, sketch_photo_image_id

-- Step 3: Add comments for clarity
COMMENT ON COLUMN properties.owner_photo_image_id IS 'GitLab image ID for owner photo';
COMMENT ON COLUMN properties.signature_image_id IS 'GitLab image ID for signature';
COMMENT ON COLUMN properties.sketch_photo_image_id IS 'GitLab image ID for sketch photo';

-- Step 4: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN (
    'owner_photo_image_id', 
    'signature_image_id', 
    'sketch_photo_image_id',
    'owner_tenant_photo',
    'signature_data',
    'sketch_photo'
)
ORDER BY column_name;
