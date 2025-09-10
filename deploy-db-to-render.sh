#!/bin/bash

# Deploy Database Changes to Render PostgreSQL
# This script runs the comprehensive migration on Render

echo "🚀 Starting database migration to Render PostgreSQL..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! render whoami &> /dev/null; then
    echo "❌ Not logged into Render. Please run 'render login' first."
    exit 1
fi

echo "✅ Render CLI is available and user is logged in"

# Database ID from your Render services
DB_ID="dpg-d2mkvpogjchc73cp1o6g-a"

echo "📊 Running migration on database: $DB_ID"

# Run the migration
echo "🔄 Executing migration script..."
cat deploy-to-render.sql | render psql $DB_ID

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo "🎉 Your Render PostgreSQL database is now updated with:"
    echo "   - property_images table for GitLab image storage"
    echo "   - Image reference columns in properties table"
    echo "   - Fixed enum type conflicts"
    echo "   - Proper indexes and constraints"
else
    echo "❌ Database migration failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo "🚀 Ready to deploy backend changes!"
