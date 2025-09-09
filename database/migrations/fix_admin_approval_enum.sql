-- Fix Migration: Fix Admin Approval ENUM Type
-- Date: 2025-01-26
-- Description: Fixes the approval_status column to use proper ENUM type

-- Drop existing columns that were created with wrong types
ALTER TABLE properties 
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS admin_notes,
DROP COLUMN IF EXISTS approval_status;

-- Create ENUM type for approval status
DO $$ BEGIN
    CREATE TYPE approval_status_enum AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate columns with proper types
ALTER TABLE properties 
ADD COLUMN approved_by UUID REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN admin_notes TEXT,
ADD COLUMN approval_status approval_status_enum DEFAULT 'pending_approval';

-- Add comments for documentation
COMMENT ON COLUMN properties.approved_by IS 'ID of admin user who approved/rejected the survey';
COMMENT ON COLUMN properties.approved_at IS 'Timestamp when survey was approved/rejected';
COMMENT ON COLUMN properties.rejection_reason IS 'Reason for rejection if survey was rejected';
COMMENT ON COLUMN properties.admin_notes IS 'Additional notes from admin during approval process';
COMMENT ON COLUMN properties.approval_status IS 'Current approval status: pending_approval, approved, rejected';

-- Create indexes for better performance on approval queries
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);
CREATE INDEX IF NOT EXISTS idx_properties_approved_by ON properties(approved_by);
CREATE INDEX IF NOT EXISTS idx_properties_approved_at ON properties(approved_at);

-- Create composite index for common approval queries
CREATE INDEX IF NOT EXISTS idx_properties_approval_zone_type ON properties(approval_status, zone, property_type);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('approved_by', 'approved_at', 'rejection_reason', 'admin_notes', 'approval_status')
ORDER BY column_name;
