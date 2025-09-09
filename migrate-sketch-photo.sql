-- Migration: Fix sketch_photo column type from VARCHAR(255) to TEXT
-- This will allow Base64 image data to be stored without length constraints

-- Check current column type
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    'Current column type' as status
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'sketch_photo';

-- Run the migration
ALTER TABLE properties ALTER COLUMN sketch_photo TYPE TEXT;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    'New column type' as status
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'sketch_photo';

-- Show confirmation
SELECT 'Migration completed successfully! sketch_photo column is now TEXT type.' as result;
