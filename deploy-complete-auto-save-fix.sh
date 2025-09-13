#!/bin/bash

# Deploy Complete Auto-Save Fix to Production
# This script applies the complete database migration to fix ALL auto-save constraints

echo "🚀 Deploying Complete Auto-Save Fix to Production..."

# Set production database URL
export DATABASE_URL="postgresql://explorebackend_db_user:DecXbUcWT0XI3CgYDct8dkimZpis66gN@dpg-d2mkvpogjchc73cp1o6g-a.singapore-postgres.render.com/explorebackend_db"

echo "📋 Applying complete database migration..."

# Apply the complete migration
psql "$DATABASE_URL" -f database/migrations/fix_all_auto_save_constraints.sql

if [ $? -eq 0 ]; then
    echo "✅ Complete database migration applied successfully!"
    echo "🔄 Auto-save should now work for ALL draft properties"
else
    echo "❌ Database migration failed!"
    exit 1
fi

echo "🎉 Complete auto-save fix deployment completed!"
echo ""
echo "📝 What was fixed:"
echo "   - Removed NOT NULL constraints from ALL required fields:"
echo "     • owner_name"
echo "     • locality"
echo "     • ward_number"
echo "     • pincode"
echo "     • property_type"
echo "     • plot_area"
echo "     • built_up_area"
echo "     • carpet_area"
echo "   - Auto-save can now save empty fields as null for ALL drafts"
echo "   - Final submissions still require all mandatory fields via model validation"
echo ""
echo "🧪 Next steps:"
echo "   1. Test auto-save functionality in production"
echo "   2. Verify that drafts save with empty fields"
echo "   3. Confirm final submissions still validate required fields"
echo "   4. Check that no more constraint errors occur"
