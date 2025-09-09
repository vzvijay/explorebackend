-- Database Deployment Script for Render
-- This script combines all migrations and seed data

-- ===========================================
-- 1. ADD SKETCH PHOTO TO PROPERTIES
-- ===========================================
DO $$ 
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'sketch_photo'
    ) THEN
        ALTER TABLE properties ADD COLUMN sketch_photo VARCHAR(255);
        RAISE NOTICE 'Added sketch_photo column to properties table';
    ELSE
        RAISE NOTICE 'sketch_photo column already exists in properties table';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'sketch_photo_captured_at'
    ) THEN
        ALTER TABLE properties ADD COLUMN sketch_photo_captured_at TIMESTAMP;
        RAISE NOTICE 'Added sketch_photo_captured_at column to properties table';
    ELSE
        RAISE NOTICE 'sketch_photo_captured_at column already exists in properties table';
    END IF;
END $$;

-- ===========================================
-- 2. ADD ADMIN APPROVAL TO PROPERTIES
-- ===========================================
DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE properties ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending_approval';
        RAISE NOTICE 'Added approval_status column to properties table';
    ELSE
        RAISE NOTICE 'approval_status column already exists in properties table';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE properties ADD COLUMN approved_by VARCHAR(255);
        RAISE NOTICE 'Added approved_by column to properties table';
    ELSE
        RAISE NOTICE 'approved_by column already exists in properties table';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE properties ADD COLUMN approved_at TIMESTAMP;
        RAISE NOTICE 'Added approved_at column to properties table';
    ELSE
        RAISE NOTICE 'approved_at column already exists in properties table';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE properties ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column to properties table';
    ELSE
        RAISE NOTICE 'rejection_reason column already exists in properties table';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE properties ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column to properties table';
    ELSE
        RAISE NOTICE 'admin_notes column already exists in properties table';
    END IF;
END $$;

-- ===========================================
-- 3. ADD EDIT TRACKING TO PROPERTIES
-- ===========================================
DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'edit_count'
    ) THEN
        ALTER TABLE properties ADD COLUMN edit_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added edit_count column to properties table';
    ELSE
        RAISE NOTICE 'edit_count column already exists in properties table';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'last_edit_date'
    ) THEN
        ALTER TABLE properties ADD COLUMN last_edit_date TIMESTAMP;
        RAISE NOTICE 'Added last_edit_date column to properties table';
    ELSE
        RAISE NOTICE 'last_edit_date column already exists in properties table';
    END IF;
END $$;

-- ===========================================
-- 4. ADD ZONE TO PROPERTIES
-- ===========================================
DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'zone'
    ) THEN
        ALTER TABLE properties ADD COLUMN zone VARCHAR(50);
        RAISE NOTICE 'Added zone column to properties table';
    ELSE
        RAISE NOTICE 'zone column already exists in properties table';
    END IF;
END $$;

-- ===========================================
-- 5. FIX ADMIN APPROVAL ENUM
-- ===========================================
-- Update existing properties to have proper approval status
UPDATE properties 
SET approval_status = 'pending_approval' 
WHERE approval_status IS NULL OR approval_status = '';

-- ===========================================
-- 6. FIX SKETCH PHOTO COLUMN TYPE
-- ===========================================
DO $$ 
BEGIN
    -- Check current column type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'sketch_photo' 
        AND data_type = 'character varying' 
        AND character_maximum_length = 255
    ) THEN
        -- Change sketch_photo from VARCHAR(255) to TEXT
        ALTER TABLE properties ALTER COLUMN sketch_photo TYPE TEXT;
        RAISE NOTICE 'Fixed sketch_photo column: Changed from VARCHAR(255) to TEXT';
    ELSE
        RAISE NOTICE 'sketch_photo column is already TEXT type or different size';
    END IF;
END $$;

-- ===========================================
-- 6. INSERT SEED DATA (USERS)
-- ===========================================
-- Check if users table exists and insert seed data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Insert admin user if not exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@explore.com') THEN
            INSERT INTO users (
                id, 
                employee_id, 
                first_name, 
                last_name, 
                email, 
                phone, 
                password, 
                role, 
                department, 
                assigned_area,
                is_active,
                created_at,
                updated_at
            ) VALUES (
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
            );
            RAISE NOTICE 'Added admin user: admin@explore.com';
        ELSE
            RAISE NOTICE 'Admin user already exists';
        END IF;

        -- Insert field executive 1 if not exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'field1@maharashtra.gov.in') THEN
            INSERT INTO users (
                id, 
                employee_id, 
                first_name, 
                last_name, 
                email, 
                phone, 
                password, 
                role, 
                department, 
                assigned_area,
                is_active,
                created_at,
                updated_at
            ) VALUES (
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
            );
            RAISE NOTICE 'Added field executive 1: field1@maharashtra.gov.in';
        ELSE
            RAISE NOTICE 'Field executive 1 already exists';
        END IF;

        -- Insert field executive 2 if not exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'field2@maharashtra.gov.in') THEN
            INSERT INTO users (
                id, 
                employee_id, 
                first_name, 
                last_name, 
                email, 
                phone, 
                password, 
                role, 
                department, 
                assigned_area,
                is_active,
                created_at,
                updated_at
            ) VALUES (
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
            );
            RAISE NOTICE 'Added field executive 2: field2@maharashtra.gov.in';
        ELSE
            RAISE NOTICE 'Field executive 2 already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist, skipping user creation';
    END IF;
END $$;

-- ===========================================
-- 7. VERIFICATION
-- ===========================================
-- Show table structure
\d properties;

-- Show users
SELECT id, email, role, first_name, last_name FROM users;

-- Show column information
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

RAISE NOTICE 'Database deployment completed successfully!';
