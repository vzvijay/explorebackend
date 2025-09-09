-- Migration: Add Edit Tracking Fields for Always Editable System
-- Date: 2025-08-26
-- Description: Adds fields to track property edits for the always editable system

-- Add new columns for edit tracking
ALTER TABLE properties 
ADD COLUMN last_edit_comment TEXT,
ADD COLUMN last_edit_date TIMESTAMP,
ADD COLUMN last_edit_by UUID REFERENCES users(id),
ADD COLUMN edit_count INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN properties.last_edit_comment IS 'Comment required for post-submission edits';
COMMENT ON COLUMN properties.last_edit_date IS 'Date of last edit';
COMMENT ON COLUMN properties.last_edit_by IS 'User who made the last edit';
COMMENT ON COLUMN properties.edit_count IS 'Number of times this property has been edited';

-- Update existing properties to have edit_count = 0
UPDATE properties SET edit_count = 0 WHERE edit_count IS NULL;

-- Create index for better performance on edit tracking queries
CREATE INDEX idx_properties_edit_tracking ON properties(last_edit_date, edit_count);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('last_edit_comment', 'last_edit_date', 'last_edit_by', 'edit_count')
ORDER BY column_name;
