#!/bin/bash

echo "🚀 Deploying Database Changes to Render..."
echo "=========================================="

# Database ID from Render
DB_ID="dpg-d2mkvpogjchc73cp1o6g-a"

echo "📊 Database ID: $DB_ID"
echo "🔗 Connecting to Render PostgreSQL database..."

# Execute the deployment SQL script
echo "📝 Executing database deployment script..."
render psql $DB_ID < deploy-to-render.sql

echo "✅ Database deployment completed!"
echo ""
echo "🔍 You can now verify the changes by:"
echo "   1. Connecting to your database: render psql $DB_ID"
echo "   2. Checking table structure: \\d properties"
echo "   3. Viewing users: SELECT * FROM users;"
echo ""
echo "🌐 Your database is now updated with all the latest schema changes and seed data!"
