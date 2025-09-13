-- Migration: Fix ALL auto-save constraints for draft properties
-- This migration removes NOT NULL constraints from ALL fields that should allow null values during auto-save
-- while maintaining data integrity for final submissions through model validation

-- Remove NOT NULL constraints from all required fields for auto-save
ALTER TABLE properties ALTER COLUMN owner_name DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN locality DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN ward_number DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN pincode DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN property_type DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN plot_area DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN built_up_area DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN carpet_area DROP NOT NULL;

-- Add comments to document the changes
COMMENT ON COLUMN properties.owner_name IS 'Owner name - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.locality IS 'Locality - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.ward_number IS 'Ward number - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.pincode IS 'Pincode - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.property_type IS 'Property type - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.plot_area IS 'Plot area - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.built_up_area IS 'Built-up area - can be null for drafts, required for submissions';
COMMENT ON COLUMN properties.carpet_area IS 'Carpet area - can be null for drafts, required for submissions';

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'properties' 
    AND column_name IN (
        'owner_name', 'locality', 'ward_number', 'pincode', 
        'property_type', 'plot_area', 'built_up_area', 'carpet_area',
        'survey_number', 'zone'
    )
ORDER BY column_name;
