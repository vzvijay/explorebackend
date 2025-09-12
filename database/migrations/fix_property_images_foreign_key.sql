-- Migration: Fix Property Images Foreign Key Constraint
-- Date: 2025-01-27
-- Purpose: Fix production database to match local schema
-- Issue: property_images.property_id should reference properties.property_id (STRING), not properties.id (UUID)

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

-- Step 7: Add comment to document the fix
COMMENT ON COLUMN property_images.property_id IS 'Property ID this image belongs to (e.g., PROP-2025-001) - Fixed to reference properties.property_id';

-- Step 8: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'property_images' 
AND column_name = 'property_id';

-- Step 9: Verify foreign key constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'property_images'
AND kcu.column_name = 'property_id';

-- Step 10: Show success message
SELECT 'Migration completed successfully! property_images.property_id now references properties.property_id' AS status;
