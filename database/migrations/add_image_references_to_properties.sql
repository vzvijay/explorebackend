-- Migration: Add image reference columns to properties table
-- Date: 2025-01-27
-- Purpose: Add foreign key references to property_images table

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

-- Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('owner_photo_image_id', 'signature_image_id', 'sketch_photo_image_id')
ORDER BY column_name;
