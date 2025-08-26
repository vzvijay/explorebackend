#!/bin/bash

echo "🚀 Maharashtra Survey Backend - Render Deployment"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "   ✅ Render account created"
echo "   ✅ Render CLI installed and authenticated"
echo "   ✅ Backend code ready"
echo ""

echo "🎯 Step-by-Step Deployment Process:"
echo ""

echo "1️⃣ Create Backend Service in Render Dashboard:"
echo "   - Go to https://dashboard.render.com"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your GitHub repo OR use 'Deploy from existing code'"
echo "   - Name: maharashtra-survey-backend"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""

echo "2️⃣ Configure Environment Variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=3000"
echo "   - JWT_SECRET=<generate-a-secure-random-string>"
echo "   - JWT_EXPIRES_IN=24h"
echo "   - CORS_ORIGIN=https://surveyapplication-gnqf21zjg-vijay-vs-projects-ebeee0fa.vercel.app"
echo "   - RATE_LIMIT_WINDOW_MS=900000"
echo "   - RATE_LIMIT_MAX_REQUESTS=100"
echo "   - MAX_FILE_SIZE=10485760"
echo "   - UPLOAD_PATH=./uploads"
echo "   - BCRYPT_ROUNDS=12"
echo ""

echo "3️⃣ Create PostgreSQL Database:"
echo "   - In Render dashboard, click 'New +' → 'PostgreSQL'"
echo "   - Name: maharashtra-survey-db"
echo "   - Plan: Free"
echo "   - Copy the DATABASE_URL and add it to environment variables"
echo ""

echo "4️⃣ Deploy and Test:"
echo "   - Click 'Create Web Service'"
echo "   - Wait for deployment to complete"
echo "   - Test the health endpoint: https://your-service-name.onrender.com/health"
echo ""

echo "5️⃣ Update Frontend:"
echo "   - Go to Vercel dashboard"
echo "   - Update VITE_API_URL to your Render backend URL"
echo "   - Redeploy frontend if needed"
echo ""

echo "🔗 Your Render Backend URL will be:"
echo "   https://your-service-name.onrender.com"
echo ""

echo "📝 Important Notes:"
echo "   - Service sleeps after 15 minutes of inactivity"
echo "   - First request after sleep takes 30-60 seconds"
echo "   - Subsequent requests are instant until next sleep"
echo "   - 750 hours/month free tier"
echo ""

echo "❓ Need Help?"
echo "   - Render Docs: https://render.com/docs"
echo "   - Check deployment logs in Render dashboard"
echo ""

echo "🎉 Ready to deploy! Follow the steps above."
echo ""
echo "Press Enter when you're ready to proceed with the deployment..."
read -p ""

echo "🚀 Starting deployment process..."
echo ""

# Check if user wants to proceed with CLI deployment
echo "Would you like me to help you deploy via CLI now? (y/n)"
read -p "Enter y/n: " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Attempting CLI deployment..."
    
    # Try to create service via CLI
    echo "Creating service via CLI..."
    render services create --name maharashtra-survey-backend --type web --env node --build-command "npm install" --start-command "npm start"
    
    if [ $? -eq 0 ]; then
        echo "✅ Service created successfully via CLI!"
        echo "Now configure environment variables in the Render dashboard."
    else
        echo "⚠️ CLI deployment failed. Please use the web dashboard method above."
    fi
else
    echo "📋 Please follow the web dashboard steps above."
    echo "Let me know if you need help with any specific step!"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Complete the deployment in Render dashboard"
echo "   2. Get your backend URL"
echo "   3. Update Vercel environment variables"
echo "   4. Test the full application"
echo ""
echo "Happy Deploying! 🚀"
