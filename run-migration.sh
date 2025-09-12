#!/bin/bash

# Run database migration using Render CLI
echo "🚀 Starting database migration via Render CLI..."

# Test connection first
echo "🔍 Testing database connection..."
render psql dpg-d2mkvpogjchc73cp1o6g-a -- -c "SELECT 'Connection successful!' as status;"

echo "📋 Running migration script..."
# Run the migration script
render psql dpg-d2mkvpogjchc73cp1o6g-a -- -f production-database-deployment.sql

echo "✅ Migration completed!"
