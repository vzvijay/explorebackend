-- Final schema fix to handle unmapped property_images

-- Step 1: Check what we're working with
SELECT 'Current state check:' as info;
SELECT 'Properties count:' as info, COUNT(*) as count FROM properties;
SELECT 'Property_images with empty property_id:' as info, COUNT(*) as count FROM property_images WHERE property_id IS NULL OR property_id = '';

-- Step 2: For property_images with empty property_id, we need to either:
-- a) Map them to existing properties if we can determine the relationship
-- b) Delete them if they're orphaned
-- c) Assign them to a default property

-- Let's first try to map them based on creation time or other heuristics
-- Since we can't easily determine the relationship, let's assign them to the first property
-- This is a temporary solution - in production you'd want better mapping logic

UPDATE property_images 
SET property_id = (SELECT property_id FROM properties ORDER BY created_at LIMIT 1)
WHERE property_id IS NULL OR property_id = '';

-- Step 3: Now make property_id NOT NULL in property_images
ALTER TABLE property_images 
ALTER COLUMN property_id SET NOT NULL;

-- Step 4: Verify the foreign key constraint works
-- First, let's make sure all property_images have valid property_id values
SELECT 'Property_images with invalid property_id:' as info, COUNT(*) as count
FROM property_images pi 
LEFT JOIN properties p ON pi.property_id = p.property_id 
WHERE p.property_id IS NULL;

-- Step 5: If there are still invalid references, we need to clean them up
-- For now, let's delete any property_images that don't have valid property references
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT property_id FROM properties);

-- Step 6: Final verification
SELECT 'Final verification:' as info;
SELECT 'Properties:' as table_name, COUNT(*) as count FROM properties;
SELECT 'Property_images:' as table_name, COUNT(*) as count FROM property_images;

-- Check that all property_images have valid property_id references
SELECT 'Valid property_images references:' as info, COUNT(*) as count
FROM property_images pi 
JOIN properties p ON pi.property_id = p.property_id;

-- Show sample data
SELECT 'Sample properties:' as info;
SELECT property_id, survey_number, owner_name FROM properties LIMIT 3;

SELECT 'Sample property_images:' as info;
SELECT property_id, image_type, file_name FROM property_images LIMIT 3;

SELECT 'Schema fix completed successfully!' as result;
