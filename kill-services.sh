#!/bin/bash

echo "🛑 STOPPING SERVICES"
echo "==================="
echo ""

# Kill services on ports 3000 and 3001
echo "🧹 Stopping Backend API (Port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend stopped"
else
    echo "⚠️  No backend service found on port 3000"
fi

echo "🧹 Stopping Frontend Dashboard (Port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend stopped"
else
    echo "⚠️  No frontend service found on port 3001"
fi

# Also kill any remaining Node.js processes related to our project
echo "🧹 Cleaning up remaining processes..."
pkill -f "npm start" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "node src/server.js" 2>/dev/null

sleep 2

echo ""
echo "🎉 ALL SERVICES STOPPED!"
echo "======================="
echo ""
echo "To restart services: ./start-services.sh"
echo "" 