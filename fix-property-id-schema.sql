-- Fix property_id column types for Property ID approach
-- This script updates the database schema to use VARCHAR for property_id instead of UUID

-- 1. Update property_images table property_id column
ALTER TABLE property_images 
ALTER COLUMN property_id TYPE VARCHAR(100);

-- 2. Update properties table property_id column (if it exists as UUID)
-- First check if property_id column exists and what type it is
DO $$ 
BEGIN
    -- Check if property_id column exists in properties table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'property_id'
    ) THEN
        -- Update the column type if it exists
        ALTER TABLE properties 
        ALTER COLUMN property_id TYPE VARCHAR(100);
        
        RAISE NOTICE 'Updated properties.property_id to VARCHAR(100)';
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE properties 
        ADD COLUMN property_id VARCHAR(100) UNIQUE NOT NULL;
        
        RAISE NOTICE 'Added properties.property_id as VARCHAR(100)';
    END IF;
END $$;

-- 3. Update foreign key constraint in property_images
-- Drop the existing foreign key constraint
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

-- Add new foreign key constraint referencing property_id instead of id
ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE;

-- 4. Update image reference columns in properties table
-- These should reference property_images.id (UUID) not property_id
-- So we don't need to change these columns

-- 5. Create index on property_id for better performance
CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- 6. Add some sample data for testing (optional)
-- This will help verify the schema works
INSERT INTO properties (id, property_id, survey_number, owner_name, locality, ward_number, pincode, zone, property_type, construction_type, plot_area, built_up_area, carpet_area, surveyed_by, survey_date, survey_status)
VALUES (
    gen_random_uuid(),
    'PROP-2025-TEST',
    'SUR-2025-TEST',
    'Test Owner',
    'Test Locality',
    1,
    '123456',
    'A',
    'residential',
    'rcc',
    100.0,
    80.0,
    70.0,
    (SELECT id FROM users LIMIT 1),
    NOW(),
    'draft'
) ON CONFLICT (property_id) DO NOTHING;

SELECT 'Database schema updated successfully for Property ID approach!' as result;
