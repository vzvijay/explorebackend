#!/bin/bash

echo "🚀 Maharashtra Survey Management System - Quick Deploy"
echo "=================================================="
echo ""
echo "This script will guide you through deploying to Vercel + Railway"
echo ""

# Check if scripts exist
if [ ! -f "deploy-railway.sh" ] || [ ! -f "deploy-vercel.sh" ]; then
    echo "❌ Deployment scripts not found. Please ensure you're in the project root."
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "   ✅ GitHub account"
echo "   ✅ Vercel account (free)"
echo "   ✅ Railway account (free)"
echo "   ✅ Node.js installed"
echo ""

read -p "Have you created accounts on Vercel and Railway? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔗 Please create accounts first:"
    echo "   Vercel: https://vercel.com"
    echo "   Railway: https://railway.app"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "🎯 Starting Deployment Process..."
echo ""

echo "📱 Phase 1: Deploying Backend to Railway..."
echo "   This will open Railway CLI for authentication..."
echo ""
read -p "Press Enter to continue with Railway deployment..."

./deploy-railway.sh

echo ""
echo "🌐 Phase 2: Deploying Frontend to Vercel..."
echo "   This will open Vercel CLI for authentication..."
echo ""
read -p "Press Enter to continue with Vercel deployment..."

./deploy-vercel.sh

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Update CORS_ORIGIN in Railway with your Vercel URL"
echo "   2. Test your application"
echo "   3. Configure custom domain (optional)"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT-GUIDE.md"
echo ""
echo "Happy Deploying! 🚀"
