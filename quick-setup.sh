#!/bin/bash

echo "🏛️  MAHARASHTRA SURVEY SYSTEM - QUICK SETUP"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "   Please install PostgreSQL from https://www.postgresql.org/download/"
    echo "   Or on macOS: brew install postgresql"
    echo "   Or on Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL detected"
echo ""

echo "📦 Installing Backend Dependencies..."
cd backend
if [ ! -f package.json ]; then
    echo "❌ Backend package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend npm install failed!"
    exit 1
fi

echo "✅ Backend dependencies installed"
echo ""

echo "📦 Installing Frontend Dependencies..."
cd ../web-dashboard
if [ ! -f package.json ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend npm install failed!"
    exit 1
fi

echo "✅ Frontend dependencies installed"
echo ""

echo "🔧 Setting up environment files..."
cd ../backend
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Backend .env file created"
else
    echo "⚠️  Backend .env file already exists"
fi

cd ..
echo ""
echo "🎉 QUICK SETUP COMPLETED!"
echo "========================"
echo ""
echo "Next steps:"
echo "1. Run: ./setup-database.sh"
echo "2. Run: ./start-services.sh"
echo "3. Open: http://localhost:3001"
echo "" 