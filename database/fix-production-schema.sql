-- Quick Fix for Production Database Schema
-- Run this directly on your Render database to fix the foreign key constraint issue

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

-- Step 2: Drop the existing property_id column (it's currently UUID)
ALTER TABLE property_images 
DROP COLUMN IF EXISTS property_id;

-- Step 3: Add the correct property_id column (STRING) that references properties.property_id
ALTER TABLE property_images 
ADD COLUMN property_id VARCHAR(100) NOT NULL;

-- Step 4: Add the correct foreign key constraint
ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE;

-- Step 5: Recreate the index for better performance
DROP INDEX IF EXISTS idx_property_images_property_id;
CREATE INDEX idx_property_images_property_id ON property_images(property_id);

-- Step 6: Add composite index for common queries
DROP INDEX IF EXISTS idx_property_images_property_type;
CREATE INDEX idx_property_images_property_type ON property_images(property_id, image_type);

-- Step 7: Verify the changes
SELECT 
    'Schema fix completed!' AS status,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'property_images' 
AND column_name = 'property_id';
