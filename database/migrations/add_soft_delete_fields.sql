-- Migration: Add soft delete fields to properties table
-- Date: 2025-01-15
-- Description: Add fields for soft delete functionality with audit trail

-- Add soft delete fields
ALTER TABLE properties 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by UUID NULL,
ADD COLUMN deletion_reason TEXT NULL;

-- Add foreign key constraint for deleted_by
ALTER TABLE properties 
ADD CONSTRAINT fk_properties_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id);

-- Add indexes for performance
CREATE INDEX idx_properties_deleted_at ON properties(deleted_at);
CREATE INDEX idx_properties_deleted_by ON properties(deleted_by);

-- Add comments for documentation
COMMENT ON COLUMN properties.deleted_at IS 'Timestamp when property was soft deleted';
COMMENT ON COLUMN properties.deleted_by IS 'ID of admin user who deleted the property';
COMMENT ON COLUMN properties.deletion_reason IS 'Reason for deletion provided by admin';

-- Update existing queries to exclude soft-deleted properties by default
-- Note: This migration only adds the fields. Application code should be updated
-- to filter out deleted_at IS NOT NULL in all property queries
