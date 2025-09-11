-- Migration: Remove unique constraint from survey_number column
-- Date: 2025-01-27
-- Purpose: Allow duplicate survey numbers while keeping property_id unique

-- Remove the unique constraint from survey_number column
-- This allows multiple properties to have the same survey number
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_survey_number_key;

-- Verify the constraint was removed
-- This query should return no rows if the constraint was successfully removed
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'properties'::regclass 
    AND conname LIKE '%survey_number%';

-- Add a comment to document the change
COMMENT ON COLUMN properties.survey_number IS 'Survey number - can be duplicate across different properties';
