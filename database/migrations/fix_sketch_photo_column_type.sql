-- Migration: Fix sketch_photo column type to support Base64 image data
-- Date: 2025-08-30
-- Issue: sketch_photo column is VARCHAR(255) but Base64 images are much longer

-- Change sketch_photo column from VARCHAR(255) to TEXT
ALTER TABLE properties 
ALTER COLUMN sketch_photo TYPE TEXT;

-- Verify the change
-- You can run: \d properties; to see the updated schema
