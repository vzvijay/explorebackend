-- Simple migration for Render PostgreSQL
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  temp_property_id VARCHAR(100),
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

-- Add image reference columns to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_photo_image_id UUID REFERENCES property_images(id),
ADD COLUMN IF NOT EXISTS signature_image_id UUID REFERENCES property_images(id),
ADD COLUMN IF NOT EXISTS sketch_photo_image_id UUID REFERENCES property_images(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_temp_property_id ON property_images(temp_property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_image_type ON property_images(image_type);

-- Fix enum type conflicts
DROP TYPE IF EXISTS enum_properties_approval_status CASCADE;
DROP TYPE IF EXISTS approval_status_enum CASCADE;
CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- Update approval_status column
ALTER TABLE properties 
ALTER COLUMN approval_status TYPE approval_status_enum 
USING approval_status::text::approval_status_enum;

SELECT 'Migration completed successfully!' as result;
