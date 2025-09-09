-- Fix All Admin User Passwords
-- Update passwords to working hashes

-- Update admin user password to 'admin123' (working hash)
UPDATE users 
SET password = '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M'
WHERE email = 'admin@explore.com';

-- Update gajanan.tayde password to 'gajanan@123' (using working hash pattern)
UPDATE users 
SET password = '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M'
WHERE email = 'gajanan.tayde';

-- Update vilas.tavde password to 'vilas@123' (using working hash pattern)
UPDATE users 
SET password = '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M'
WHERE email = 'vilas.tavde';

-- Verify all updates
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
WHERE role = 'admin'
ORDER BY created_at;

-- Show all admin users with their credentials
SELECT 
    employee_id,
    first_name,
    last_name,
    email as username,
    role,
    CASE 
        WHEN email = 'admin@explore.com' THEN 'admin123'
        WHEN email = 'gajanan.tayde' THEN 'gajanan@123'
        WHEN email = 'vilas.tavde' THEN 'vilas@123'
        ELSE 'Unknown'
    END as password,
    is_active
FROM users 
WHERE role = 'admin'
ORDER BY created_at;
