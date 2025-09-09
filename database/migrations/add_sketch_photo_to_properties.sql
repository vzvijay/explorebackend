-- Migration: Add Sketch Photo Fields for Hand-Drawn Sketch Capture
-- Date: 2025-01-26
-- Description: Adds fields to store hand-drawn sketch photos captured before digital signature

-- Add new columns for sketch photo
ALTER TABLE properties 
ADD COLUMN sketch_photo VARCHAR(255),
ADD COLUMN sketch_photo_captured_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN properties.sketch_photo IS 'Path to hand-drawn sketch photo file';
COMMENT ON COLUMN properties.sketch_photo_captured_at IS 'Timestamp when sketch photo was captured';

-- Create index for better performance on sketch photo queries
CREATE INDEX idx_properties_sketch_photo ON properties(sketch_photo);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('sketch_photo', 'sketch_photo_captured_at')
ORDER BY column_name;
