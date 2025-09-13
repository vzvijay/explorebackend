#!/bin/bash

# GitLab Image Storage Dependencies Installation Script
# This script installs the required dependencies for GitLab-based image storage

echo "🚀 Installing GitLab Image Storage Dependencies..."

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd backend || exit 1

npm install axios form-data
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Frontend dependencies (imageApi is already created)
echo "📦 Checking frontend dependencies..."
cd ../web-dashboard || exit 1

# No additional frontend dependencies needed - imageApi uses existing axios
echo "✅ Frontend dependencies are already available"

echo ""
echo "🎉 All dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in backend/.env:"
echo "   GITLAB_PROJECT_ID=74298992"
echo "   GITLAB_TOKEN=your_token_here"
echo "   GITLAB_API_URL=https://gitlab.com/api/v4"
echo "   GITLAB_REPO_PATH=images/properties"
echo ""
echo "2. Run database migrations:"
echo "   psql -d your_database -f database/migrations/create_property_images_table.sql"
echo "   psql -d your_database -f database/migrations/add_image_references_to_properties.sql"
echo ""
echo "3. Migrate existing data:"
echo "   node database/migrations/migrate_base64_to_gitlab.js"
echo ""
echo "4. Test the new image upload system"
echo ""
echo "📖 For detailed setup instructions, see: GITLAB_IMAGE_STORAGE_SETUP.md"
