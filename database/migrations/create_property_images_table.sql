-- Migration: Create property_images table for GitLab image storage
-- Date: 2025-01-27
-- Purpose: Replace base64 image storage with GitLab URL references

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_property_images_image_type ON property_images(image_type);
CREATE INDEX IF NOT EXISTS idx_property_images_uploaded_by ON property_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_property_images_property_type ON property_images(property_id, image_type);

-- Add comments to document the table purpose
COMMENT ON TABLE property_images IS 'Stores metadata for images uploaded to GitLab repository';
COMMENT ON COLUMN property_images.property_id IS 'Reference to the property this image belongs to';
COMMENT ON COLUMN property_images.image_type IS 'Type of image: owner_photo, signature, or sketch_photo';
COMMENT ON COLUMN property_images.gitlab_file_path IS 'Full path to the file in GitLab repository';
COMMENT ON COLUMN property_images.gitlab_url IS 'Public URL to access the image from GitLab';
COMMENT ON COLUMN property_images.file_name IS 'Original file name of the uploaded image';
COMMENT ON COLUMN property_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN property_images.mime_type IS 'MIME type of the image file';
COMMENT ON COLUMN property_images.uploaded_by IS 'User who uploaded the image';
COMMENT ON COLUMN property_images.uploaded_at IS 'Timestamp when the image was uploaded';

-- Verify the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'property_images' 
ORDER BY ordinal_position;
