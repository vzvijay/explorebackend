-- Create New Admin Users
-- Date: 2025-08-30
-- Database: explorebackend_db on Render

-- Insert gajana@maharashtra.gov.in as admin
INSERT INTO users (
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'gajana@maharashtra.gov.in',
    '$2b$10$YourHashedPasswordHere', -- This will be updated with actual hash
    'admin',
    true,
    NOW(),
    NOW()
);

-- Insert vilas@@maharashtra.gov.in as admin
INSERT INTO users (
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'vilas@@maharashtra.gov.in',
    '$2b$10$YourHashedPasswordHere', -- This will be updated with actual hash
    'admin',
    true,
    NOW(),
    NOW()
);

-- Verify the users were created
SELECT id, email, role, is_active, created_at FROM users WHERE email IN ('gajana@maharashtra.gov.in', 'vilas@@maharashtra.gov.in');
