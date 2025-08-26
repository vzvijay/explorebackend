#!/bin/bash

echo "🚀 STARTING SERVICES"
echo "==================="
echo ""

# Kill any existing services on ports 3000 and 3001
echo "🧹 Cleaning up existing services..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2

# Set up environment variables
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
export DB_USER=$(whoami)
export DB_PASSWORD=""
export JWT_SECRET="maharashtra_survey_secret_2024"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="maharashtra_survey_db"

echo "🔧 Environment configured"
echo ""

# Start backend service
echo "🖥️  Starting Backend API (Port 3000)..."
cd backend
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend API is running at http://localhost:3000"
else
    echo "⚠️  Backend might be starting... (check backend.log for details)"
fi

# Start frontend service
echo ""
echo "🌐 Starting Frontend Dashboard (Port 3001)..."
cd ../web-dashboard
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 8

# Check if frontend is running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend Dashboard is running at http://localhost:3001"
else
    echo "⚠️  Frontend might be starting... (check frontend.log for details)"
fi

cd ..

echo ""
echo "🎉 SERVICES STARTED!"
echo "==================="
echo ""
echo "🌐 Web Dashboard: http://localhost:3001"
echo "🔌 Backend API:   http://localhost:3000"
echo ""
echo "📱 Login Credentials:"
echo "┌─────────────────────┬──────────────────────────────┬─────────────┐"
echo "│ Role                │ Email                        │ Password    │"
echo "├─────────────────────┼──────────────────────────────┼─────────────┤"
echo "│ Admin               │ admin@maharashtra.gov.in     │ password123 │"
echo "│ Municipal Officer   │ officer@maharashtra.gov.in   │ password123 │"
echo "│ Engineer            │ engineer@maharashtra.gov.in  │ password123 │"
echo "│ Field Executive     │ field1@maharashtra.gov.in    │ password123 │"
echo "└─────────────────────┴──────────────────────────────┴─────────────┘"
echo ""
echo "📋 How to Use:"
echo "• Field Executive: Login → Click 'New Survey' → Fill form → Submit"
echo "• Municipal Officer: Login → Go to 'Properties' → Review surveys"
echo ""
echo "📊 Logs:"
echo "• Backend: tail -f backend.log"
echo "• Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop services: ./kill-services.sh"
echo ""

# Auto-open browser (optional)
if command -v open &> /dev/null; then
    echo "🌍 Opening web browser..."
    sleep 2
    open http://localhost:3001
elif command -v xdg-open &> /dev/null; then
    echo "🌍 Opening web browser..."
    sleep 2
    xdg-open http://localhost:3001
fi

echo "✨ System is ready for use!"
echo "" 