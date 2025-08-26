#!/bin/bash

echo "🚀 Deploying Frontend to Vercel..."

# Navigate to frontend directory
cd web-dashboard

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Building and deploying..."
vercel --prod

echo "✅ Frontend deployed successfully!"
echo "🔗 Your app URL will be displayed above"
echo "📝 Don't forget to update the CORS_ORIGIN in Railway with your Vercel URL"
