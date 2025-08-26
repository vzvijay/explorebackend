#!/bin/bash

echo "🚀 Deploying Backend to Railway..."

# Navigate to backend directory
cd backend

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "📝 Please login to Railway..."
    railway login
fi

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Backend deployed successfully!"
echo "🔗 Your Railway app URL will be displayed above"
echo "📝 Don't forget to:"
echo "   1. Set up PostgreSQL database in Railway"
echo "   2. Configure environment variables in Railway dashboard"
echo "   3. Update CORS_ORIGIN with your Vercel frontend URL"
