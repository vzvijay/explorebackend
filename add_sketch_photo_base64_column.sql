-- Add sketch_photo_base64 column to properties table
-- This column stores Base64 encoded sketch photo data
ALTER TABLE "properties" ADD COLUMN "sketch_photo_base64" TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN "properties"."sketch_photo_base64" IS 'Base64 encoded sketch photo data for direct database storage';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'sketch_photo_base64';
