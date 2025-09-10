-- Comprehensive Migration Script for Render PostgreSQL
-- Date: 2025-09-09
-- Purpose: Deploy all database changes for GitLab image storage and validation fixes

-- ==============================================
-- 1. CREATE PROPERTY_IMAGES TABLE
-- ==============================================

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  temp_property_id VARCHAR(100), -- For temporary uploads before property creation
  image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('owner_photo', 'signature', 'sketch_photo')),
  gitlab_file_path VARCHAR(500) NOT NULL,
  gitlab_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_temp_property_id ON property_images(temp_property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_image_type ON property_images(image_type);
CREATE INDEX IF NOT EXISTS idx_property_images_uploaded_by ON property_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_property_images_property_type ON property_images(property_id, image_type);

-- Add comments to document the table purpose
COMMENT ON TABLE property_images IS 'Stores metadata for images uploaded to GitLab repository';
COMMENT ON COLUMN property_images.property_id IS 'Reference to the property this image belongs to';
COMMENT ON COLUMN property_images.temp_property_id IS 'Temporary property ID for images uploaded before property creation';
COMMENT ON COLUMN property_images.image_type IS 'Type of image: owner_photo, signature, or sketch_photo';
COMMENT ON COLUMN property_images.gitlab_file_path IS 'Full path to the file in GitLab repository';
COMMENT ON COLUMN property_images.gitlab_url IS 'Public URL to access the image from GitLab';
COMMENT ON COLUMN property_images.file_name IS 'Original file name of the uploaded image';
COMMENT ON COLUMN property_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN property_images.mime_type IS 'MIME type of the image file';
COMMENT ON COLUMN property_images.uploaded_by IS 'User who uploaded the image';
COMMENT ON COLUMN property_images.uploaded_at IS 'Timestamp when the image was uploaded';

-- ==============================================
-- 2. ADD IMAGE REFERENCE COLUMNS TO PROPERTIES
-- ==============================================

-- Add new columns for image references
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_photo_image_id UUID REFERENCES property_images(id),
ADD COLUMN IF NOT EXISTS signature_image_id UUID REFERENCES property_images(id),
ADD COLUMN IF NOT EXISTS sketch_photo_image_id UUID REFERENCES property_images(id);

-- Add comments to document the new columns
COMMENT ON COLUMN properties.owner_photo_image_id IS 'Reference to owner photo in property_images table';
COMMENT ON COLUMN properties.signature_image_id IS 'Reference to signature image in property_images table';
COMMENT ON COLUMN properties.sketch_photo_image_id IS 'Reference to sketch photo in property_images table';

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_properties_owner_photo_image_id ON properties(owner_photo_image_id);
CREATE INDEX IF NOT EXISTS idx_properties_signature_image_id ON properties(signature_image_id);
CREATE INDEX IF NOT EXISTS idx_properties_sketch_photo_image_id ON properties(sketch_photo_image_id);

-- ==============================================
-- 3. FIX ENUM TYPE CONFLICTS
-- ==============================================

-- Drop existing enum types if they exist to avoid conflicts
DROP TYPE IF EXISTS enum_properties_approval_status CASCADE;
DROP TYPE IF EXISTS approval_status_enum CASCADE;

-- Create the correct enum type
CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- Update the properties table to use the correct enum type
ALTER TABLE properties 
ALTER COLUMN approval_status TYPE approval_status_enum 
USING approval_status::text::approval_status_enum;

-- ==============================================
-- 4. VERIFY MIGRATION SUCCESS
-- ==============================================

-- Check if property_images table exists and has correct structure
SELECT 
    'property_images table' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- Check if image reference columns exist in properties table
SELECT 
    'image reference columns' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'properties' 
            AND column_name IN ('owner_photo_image_id', 'signature_image_id', 'sketch_photo_image_id')
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- Check if approval_status enum is working
SELECT 
    'approval_status enum' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'properties' 
            AND column_name = 'approval_status'
            AND udt_name = 'approval_status_enum'
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- Show final table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('property_images', 'properties') 
AND (table_name = 'property_images' OR column_name IN ('owner_photo_image_id', 'signature_image_id', 'sketch_photo_image_id', 'approval_status'))
ORDER BY table_name, ordinal_position;

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
SELECT 'Database migration completed successfully!' as result;
