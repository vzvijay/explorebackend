-- Migration: Add Admin Approval Fields to Properties
-- Date: 2025-01-26
-- Description: Adds fields to support admin approval workflow for property surveys

-- Create ENUM type for approval status first
DO $$ BEGIN
    CREATE TYPE approval_status_enum AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns for admin approval
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

-- Update existing survey_status values to include approval workflow
-- Note: This assumes existing surveys should start as pending_approval
UPDATE properties 
SET approval_status = 'pending_approval' 
WHERE survey_status = 'submitted' AND approval_status IS NULL;

-- Create indexes for better performance on approval queries
CREATE INDEX idx_properties_approval_status ON properties(approval_status);
CREATE INDEX idx_properties_approved_by ON properties(approved_by);
CREATE INDEX idx_properties_approved_at ON properties(approved_at);

-- Create composite index for common approval queries
CREATE INDEX idx_properties_approval_zone_type ON properties(approval_status, zone, property_type);

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
