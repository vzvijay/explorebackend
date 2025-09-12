-- Sample users for testing
-- Password for all users: 'password123'
-- Hashed using bcrypt with 12 rounds

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
) VALUES
-- Admin User
(
    gen_random_uuid(),
    'MH2024ADM001',
    'Rajesh',
    'Sharma',
    'admin@maharashtra.gov.in',
    '+919876543210',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M',
    'admin',
    'IT Department',
    'All Areas',
    true,
    NOW(),
    NOW()
),
-- Municipal Officer
(
    gen_random_uuid(),
    'MH2024MO001',
    'Priya',
    'Patel',
    'municipal.officer@maharashtra.gov.in',
    '+919876543211',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M',
    'municipal_officer',
    'Revenue Department',
    'Central District',
    true,
    NOW(),
    NOW()
),
-- Engineer
(
    gen_random_uuid(),
    'MH2024ENG001',
    'Amit',
    'Kumar',
    'engineer@maharashtra.gov.in',
    '+919876543212',
    '$2b$12$LQv3c1yqBWVHxkd0LQ4lqO7zqAqgQxzI3f8U9Fv8F5hGZ6K7J8L9M',
    'engineer',
    'Engineering Department',
    'Zone A',
    true,
    NOW(),
    NOW()
),
-- Field Executive 1
(
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
),
-- Field Executive 2
(
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

-- Sample property data (you can add more as needed)
-- Note: This will be populated by field executives during actual surveys 