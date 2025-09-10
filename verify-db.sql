-- Verify database migration
SELECT 'property_images table' as check_name,
CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_images') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
END as status;

SELECT 'image reference columns' as check_name,
CASE 
    WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name IN ('owner_photo_image_id', 'signature_image_id', 'sketch_photo_image_id')
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
END as status;

SELECT 'Migration verification complete!' as result;
