#!/bin/bash

# Deploy Schema Fix to Production Database
# This script fixes the property_images foreign key constraint issue

echo "🚀 Starting schema fix deployment to production..."

# Set environment variables (update these with your production database details)
export PGPASSWORD="your_production_password"
export PGHOST="your_production_host"
export PGPORT="5432"
export PGDATABASE="your_production_database"
export PGUSER="your_production_user"

# Alternative: Use DATABASE_URL if available
# export DATABASE_URL="postgresql://user:password@host:port/database"

echo "📋 Checking database connection..."
psql -c "SELECT version();" || {
    echo "❌ Failed to connect to database. Please check your connection details."
    exit 1
}

echo "✅ Database connection successful!"

echo "📋 Running schema fix migration..."
psql -f migrations/fix_property_images_foreign_key.sql || {
    echo "❌ Migration failed!"
    exit 1
}

echo "✅ Schema fix migration completed successfully!"

echo "📋 Verifying the fix..."
psql -c "
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'property_images'
AND kcu.column_name = 'property_id';
"

echo "🎉 Schema fix deployment completed!"
echo "📝 Next steps:"
echo "   1. Test image upload functionality"
echo "   2. Verify foreign key constraint is working"
echo "   3. Check that property_id references are correct"
