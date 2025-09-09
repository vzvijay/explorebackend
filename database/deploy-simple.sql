-- Simple Database Deployment for Render
-- Add missing columns to properties table

-- Add sketch photo columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sketch_photo VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sketch_photo_captured_at TIMESTAMP;

-- Add admin approval columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending_approval';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add edit tracking columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_edit_date TIMESTAMP;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_edit_comment TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_edit_by VARCHAR(255);

-- Add zone column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zone VARCHAR(50);

-- Update existing properties
UPDATE properties SET approval_status = 'pending_approval' WHERE approval_status IS NULL;

-- Insert admin user if not exists
INSERT INTO users (id, employee_id, first_name, last_name, email, phone, password, role, department, assigned_area, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'ADMIN001',
    'Admin',
    'User',
    'admin@explore.com',
    '+91-9876543210',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M',
    'admin',
    'Administration',
    'All Areas',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@explore.com');

-- Insert field executives if not exist
INSERT INTO users (id, employee_id, first_name, last_name, email, phone, password, role, department, assigned_area, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'MH2024FE001',
    'Rahul',
    'Jadhav',
    'field1@maharashtra.gov.in',
    '+919876543213',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M',
    'field_executive',
    'Survey Department',
    'Ward 1-5',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'field1@maharashtra.gov.in');

INSERT INTO users (id, employee_id, first_name, last_name, email, phone, password, role, department, assigned_area, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'MH2024FE002',
    'Sunita',
    'Desai',
    'field2@maharashtra.gov.in',
    '+919876543214',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M',
    'field_executive',
    'Survey Department',
    'Ward 6-10',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'field2@maharashtra.gov.in');

-- Show results
SELECT 'Database deployment completed!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_properties FROM properties;
