-- Migration: Fix auto-save constraints for draft properties
-- This migration removes NOT NULL constraints from fields that should allow null values during auto-save
-- while maintaining data integrity for final submissions

-- Remove NOT NULL constraint from survey_number (allow null for drafts)
ALTER TABLE properties ALTER COLUMN survey_number DROP NOT NULL;

-- Remove NOT NULL constraint from zone (allow null for drafts)
ALTER TABLE properties ALTER COLUMN zone DROP NOT NULL;

-- Note: The following fields already allow null values in the model:
-- - owner_name (has custom validation for submitted surveys)
-- - locality (has custom validation for submitted surveys) 
-- - ward_number (has custom validation for submitted surveys)
-- - pincode (has custom validation for submitted surveys)
-- - property_type (has custom validation for submitted surveys)
-- - plot_area (has custom validation for submitted surveys)
-- - built_up_area (has custom validation for submitted surveys)
-- - carpet_area (has custom validation for submitted surveys)

-- Add comments to document the change
COMMENT ON COLUMN properties.survey_number IS 'Survey number - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.zone IS 'Zone designation - can be null for drafts, defaults to A for submissions';

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'properties' 
    AND column_name IN ('survey_number', 'zone', 'owner_name', 'locality', 'ward_number', 'pincode', 'property_type', 'plot_area', 'built_up_area', 'carpet_area')
ORDER BY column_name;
