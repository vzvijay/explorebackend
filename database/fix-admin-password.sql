-- Fix Admin User Password Hash
-- Update the password hash to match 'admin123'

-- Update admin user password to 'admin123'
UPDATE users 
SET password = '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M'
WHERE email = 'admin@explore.com';

-- Verify the update
SELECT 
    email,
    role,
    is_active,
    CASE 
        WHEN password = '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M' 
        THEN 'Password Updated Successfully' 
        ELSE 'Password Update Failed' 
    END as password_status
FROM users 
WHERE email = 'admin@explore.com';

-- Show all admin users
SELECT 
    employee_id,
    first_name,
    last_name,
    email as username,
    role,
    is_active
FROM users 
WHERE role = 'admin'
ORDER BY created_at;
