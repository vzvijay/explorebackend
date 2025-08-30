#!/bin/bash

echo "🔧 Updating Render Environment Variables..."
echo "=========================================="

echo ""
echo "📋 Required Environment Variables for Render Backend:"
echo ""

echo "JWT_SECRET=a9b862af90c66dcb791b149ccf230ab260e41ee83df2389aaa2f6d0eea53db9f28420249fee6455588a79c3ecafeb59b892ab9e92762f7e1d1b50f56ffe15ffd"
echo ""

echo "CORS_ORIGIN=https://web-dashboard-n2c3uway2-vijay-patils-projects-47f43558.vercel.app"
echo ""

echo "DATABASE_URL=postgresql://explorebackend_db_user:DecXbUcWT0XI3CgYDct8dkimZpis66gN@dpg-d2mkvpogjchc73cp1o6g-a.singapore-postgres.render.com/explorebackend_db"
echo ""

echo "NODE_ENV=production"
echo ""

echo "PORT=3000"
echo ""

echo "JWT_EXPIRES_IN=24h"
echo ""

echo "RATE_LIMIT_WINDOW_MS=900000"
echo ""

echo "RATE_LIMIT_MAX_REQUESTS=100"
echo ""

echo "MAX_FILE_SIZE=10485760"
echo ""

echo "UPLOAD_PATH=./uploads"
echo ""

echo "BCRYPT_ROUNDS=12"
echo ""

echo ""
echo "📝 Instructions:"
echo "1. Go to your Render dashboard: https://dashboard.render.com/web/srv-d2mkkj3ipnbc73f004b0"
echo "2. Click on 'Environment' tab"
echo "3. Add/Update these environment variables"
echo "4. Save and redeploy the service"
echo ""

echo "⚠️  IMPORTANT: The JWT_SECRET above is a secure random key. Keep it secret!"
echo ""

echo "✅ After updating environment variables, the 401 authentication error should be resolved!"
