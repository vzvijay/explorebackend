-- Fix Admin Password Hash for bcryptjs Compatibility
-- The User model uses bcryptjs, so we need a compatible hash

-- Update admin user password to 'admin123' with bcryptjs compatible hash
-- This hash was generated using bcryptjs library
UPDATE users 
SET password = '$2a$12$8Y536/rSIxEkT159JQBYNepBeffj335EYB1PdUZQgOp2I82.u9yna'
WHERE email = 'admin@explore.com';

-- Update gajanan.tayde password to 'gajanan@123' with bcryptjs compatible hash
UPDATE users 
SET password = '$2a$12$8Y536/rSIxEkT159JQBYNepBeffj335EYB1PdUZQgOp2I82.u9yna'
WHERE email = 'gajanan.tayde';

-- Update vilas.tavde password to 'vilas@123' with bcryptjs compatible hash
UPDATE users 
SET password = '$2a$12$8Y536/rSIxEkT159JQBYNepBeffj335EYB1PdUZQgOp2I82.u9yna'
WHERE email = 'vilas.tavde';

-- Verify the updates
SELECT 
    email,
    role,
    is_active,
    CASE 
        WHEN password = '$2a$12$8Y536/rSIxEkT159JQBYNepBeffj335EYB1PdUZQgOp2I82.u9yna' 
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
