-- Fix missing temp_property_id column in property_images table
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS temp_property_id VARCHAR(100);

-- Create index for temp_property_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_property_images_temp_property_id ON property_images(temp_property_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'property_images' 
AND column_name = 'temp_property_id';
