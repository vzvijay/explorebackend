#!/bin/bash

# Deploy Auto-Save Fix to Production
# This script applies the database migration to fix auto-save constraints

echo "🚀 Deploying Auto-Save Fix to Production..."

# Set production database URL
export DATABASE_URL="postgresql://explorebackend_db_user:DecXbUcWT0XI3CgYDct8dkimZpis66gN@dpg-d2mkvpogjchc73cp1o6g-a.singapore-postgres.render.com/explorebackend_db"

echo "📋 Applying database migration..."

# Apply the migration
psql "$DATABASE_URL" -f database/migrations/fix_auto_save_constraints.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration applied successfully!"
    echo "🔄 Auto-save should now work for draft properties"
else
    echo "❌ Database migration failed!"
    exit 1
fi

echo "🎉 Auto-save fix deployment completed!"
echo ""
echo "📝 What was fixed:"
echo "   - Removed NOT NULL constraints from survey_number and zone"
echo "   - Auto-save can now save empty fields as null for drafts"
echo "   - Final submissions still require all mandatory fields"
echo ""
echo "🧪 Next steps:"
echo "   1. Test auto-save functionality in production"
echo "   2. Verify that drafts save with empty fields"
echo "   3. Confirm final submissions still validate required fields"
