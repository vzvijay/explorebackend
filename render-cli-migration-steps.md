# 🚀 Render CLI Database Migration Steps

## Method 1: Interactive psql Session (Recommended)

### Step 1: Open psql Session
```bash
render psql dpg-d2mkvpogjchc73cp1o6g-a
```

### Step 2: Run Migration Commands
Copy and paste these commands one by one into the psql session:

```sql
-- Test connection
SELECT 'Connection successful!' as status;

-- Step 1: Add property_id column
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_id VARCHAR(100);

-- Step 2: Generate property_id values
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM properties ORDER BY created_at LOOP
        UPDATE properties 
        SET property_id = 'PROP-2025-' || LPAD(counter::text, 3, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 3: Make property_id NOT NULL and UNIQUE
ALTER TABLE properties 
ALTER COLUMN property_id SET NOT NULL;

ALTER TABLE properties 
ADD CONSTRAINT properties_property_id_unique UNIQUE (property_id);

-- Step 4: Update property_images table
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

ALTER TABLE property_images 
ALTER COLUMN property_id TYPE VARCHAR(100);

-- Step 5: Update property_images data
UPDATE property_images 
SET property_id = p.property_id
FROM properties p
WHERE property_images.property_id = p.id::text;

UPDATE property_images 
SET property_id = (SELECT property_id FROM properties ORDER BY created_at LIMIT 1)
WHERE property_id IS NULL OR property_id = '';

ALTER TABLE property_images 
ALTER COLUMN property_id SET NOT NULL;

-- Step 6: Add new foreign key constraint
ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE;

-- Step 7: Remove base64 columns
ALTER TABLE properties DROP COLUMN IF EXISTS owner_tenant_photo;
ALTER TABLE properties DROP COLUMN IF EXISTS signature_data;
ALTER TABLE properties DROP COLUMN IF EXISTS sketch_photo;

-- Step 8: Fix image ID column types
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_owner_photo_image_id_fkey;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_signature_image_id_fkey;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_sketch_photo_image_id_fkey;

ALTER TABLE properties 
ALTER COLUMN owner_photo_image_id TYPE VARCHAR(100);

ALTER TABLE properties 
ALTER COLUMN signature_image_id TYPE VARCHAR(100);

ALTER TABLE properties 
ALTER COLUMN sketch_photo_image_id TYPE VARCHAR(100);

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_image_type ON property_images(image_type);

-- Step 10: Clean up orphaned data
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT property_id FROM properties);

-- Step 11: Verification
SELECT 'Schema Verification' as check_type;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('properties', 'property_images') 
AND column_name IN ('property_id', 'owner_photo_image_id', 'signature_image_id', 'sketch_photo_image_id')
ORDER BY table_name, column_name;

SELECT 'Data Integrity Check' as check_type;
SELECT 'Properties count:' as info, COUNT(*) as count FROM properties;
SELECT 'Property_images count:' as info, COUNT(*) as count FROM property_images;

SELECT 'Sample Data Check' as check_type;
SELECT property_id, survey_number, owner_name FROM properties LIMIT 3;

-- Success message
SELECT '🎉 Migration completed successfully!' as result;
```

### Step 3: Exit psql Session
```sql
\q
```

## Method 2: Using a Script File

If you prefer to use a file, you can:

1. Upload the `production-database-deployment.sql` file to your Render service
2. Run it using a one-off job

## Expected Results

After successful migration:
- ✅ `property_id` column added to `properties` table
- ✅ Base64 columns removed
- ✅ Image ID columns changed to VARCHAR(100)
- ✅ All foreign key constraints updated
- ✅ Performance indexes created
- ✅ Data integrity verified
