#!/bin/bash

echo "🗃️  DATABASE SETUP"
echo "=================="
echo ""

# Get current user for database
DB_USER=$(whoami)

echo "Setting up PostgreSQL database..."
echo "Using database user: $DB_USER"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "🔄 Starting PostgreSQL service..."
    
    # Try different methods to start PostgreSQL
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start postgresql
    elif command -v service &> /dev/null; then
        # Linux with service
        sudo service postgresql start
    else
        echo "⚠️  Please start PostgreSQL manually"
    fi
    
    sleep 3
    
    if ! pg_isready -q; then
        echo "❌ Could not start PostgreSQL. Please start it manually."
        echo "   macOS: brew services start postgresql"
        echo "   Linux: sudo systemctl start postgresql"
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "🔧 Creating database 'maharashtra_survey_db'..."
createdb maharashtra_survey_db 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "⚠️  Database already exists or creation failed"
fi

# Create user if it doesn't exist
echo "👤 Creating database user 'survey_user'..."
createuser -s survey_user 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ User created successfully"
else
    echo "⚠️  User already exists or creation failed"
fi

# Set up environment variables for the backend
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
export DB_USER="$DB_USER"
export DB_PASSWORD=""
export JWT_SECRET="maharashtra_survey_secret_2024"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="maharashtra_survey_db"

echo ""
echo "🌱 Setting up initial data..."
cd backend

# Run the user creation script
echo "👥 Creating sample users..."
node create-users.js
if [ $? -eq 0 ]; then
    echo "✅ Sample users created successfully"
else
    echo "❌ Failed to create sample users"
    exit 1
fi

cd ..

echo ""
echo "🎉 DATABASE SETUP COMPLETED!"
echo "============================"
echo ""
echo "Database: maharashtra_survey_db"
echo "User: survey_user"
echo "Host: localhost:5432"
echo ""
echo "Sample users created:"
echo "• admin@maharashtra.gov.in (Admin)"
echo "• officer@maharashtra.gov.in (Municipal Officer)" 
echo "• engineer@maharashtra.gov.in (Engineer)"
echo "• field1@maharashtra.gov.in (Field Executive)"
echo "Password for all: password123"
echo ""
echo "Next: Run ./start-services.sh"
echo "" 