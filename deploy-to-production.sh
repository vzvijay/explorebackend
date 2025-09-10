#!/bin/bash

# Production Database Deployment Script
# This script helps deploy your local database changes to Render PostgreSQL

echo "🚀 Production Database Deployment Script"
echo "========================================"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

echo "✅ psql is installed"

# Get database connection details
echo ""
echo "📋 Please provide your Render PostgreSQL connection details:"
echo ""

read -p "Database Host (e.g., your-db-host.onrender.com): " DB_HOST
read -p "Database Port (usually 5432): " DB_PORT
read -p "Database Name: " DB_NAME
read -p "Username: " DB_USER
read -p "Password: " -s DB_PASSWORD
echo ""

# Build connection string
CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo ""
echo "🔍 Testing database connection..."

# Test connection
if psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed. Please check your credentials."
    exit 1
fi

echo ""
echo "⚠️  IMPORTANT: This will modify your production database!"
echo "   Make sure you have a backup before proceeding."
echo ""

read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting database migration..."

# Run the migration script
if psql "$CONNECTION_STRING" -f production-database-deployment.sql; then
    echo ""
    echo "🎉 Migration completed successfully!"
    echo "✅ Your production database has been updated with all local changes."
    echo ""
    echo "Next steps:"
    echo "1. Update your backend environment variables"
    echo "2. Test the application with the new schema"
    echo "3. Verify image uploads work with GitLab storage"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo "   You may need to restore from backup if the database is in an inconsistent state."
    exit 1
fi
