#!/bin/bash

# 🚀 FEDORA DEPLOYMENT PACKAGE BUILDER
# Maharashtra Municipal Corporation Survey Management System

set -e

# Configuration
PROJECT_NAME="maharashtra-survey-system"
VERSION="1.0.0"
BUILD_DIR="./build"
PACKAGE_DIR="./package"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}🏛️  BUILDING FEDORA DEPLOYMENT PACKAGE${NC}"
echo -e "${BLUE}========================================${NC}"

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node -v)"
        exit 1
    fi
    print_status "Node.js $(node -v) detected"
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm -v) detected"
    
    if ! command -v tar &> /dev/null; then
        print_error "tar is not installed"
        exit 1
    fi
    print_status "tar detected"
}

# Clean and create directories
setup_directories() {
    print_info "Setting up build directories..."
    rm -rf "$BUILD_DIR" "$PACKAGE_DIR"
    mkdir -p "$BUILD_DIR" "$PACKAGE_DIR"
    print_status "Build directories ready"
}

# Build backend
build_backend() {
    print_info "Building backend production package..."
    
    cd backend
    
    # Install production dependencies
    print_info "Installing production dependencies..."
    npm ci --only=production
    
    # Create backend package
    mkdir -p "../$BUILD_DIR/backend"
    cp -r src ../$BUILD_DIR/backend/
    cp package.json ../$BUILD_DIR/backend/
    cp package-lock.json ../$BUILD_DIR/backend/
    cp -r node_modules ../$BUILD_DIR/backend/
    
    # Create production environment template
    cat > "../$BUILD_DIR/backend/.env.template" << EOF
NODE_ENV=production
PORT=3000
DB_HOST=\${DB_HOST}
DB_PORT=5432
DB_NAME=maharashtra_survey_db
DB_USER=\${DB_USER}
DB_PASSWORD=\${DB_PASSWORD}
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=7d
UPLOAD_PATH=/app/uploads
EOF
    
    # Create start script
    cat > "../$BUILD_DIR/backend/start.sh" << 'EOF'
#!/bin/bash
echo "Starting Maharashtra Survey System Backend..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"

mkdir -p /app/uploads
exec node src/server.js
EOF
    
    chmod +x "../$BUILD_DIR/backend/start.sh"
    
    cd ..
    print_status "Backend package built"
}

# Build frontend
build_frontend() {
    print_info "Building frontend production package..."
    
    cd web-dashboard
    
    # Install dependencies and build
    print_info "Installing dependencies and building..."
    npm ci
    npm run build
    
    # Create frontend package
    mkdir -p "../$BUILD_DIR/frontend"
    cp -r dist/* "../$BUILD_DIR/frontend/"
    
    # Create nginx configuration
    cat > "../$BUILD_DIR/frontend/nginx.conf" << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    cd ..
    print_status "Frontend package built"
}

# Create deployment scripts
create_deployment_scripts() {
    print_info "Creating deployment scripts..."
    
    # Main deployment script
    cat > "$BUILD_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# 🚀 FEDORA SERVER DEPLOYMENT SCRIPT
# Maharashtra Municipal Corporation Survey Management System

set -e

# Configuration
PROJECT_NAME="maharashtra-survey-system"
VERSION="1.0.0"
DEPLOY_DIR="/opt/maharashtra-survey"
SERVICE_USER="survey-system"
DB_NAME="maharashtra_survey_db"
DB_USER="survey_user"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}🏛️  DEPLOYING MAHARASHTRA SURVEY SYSTEM TO FEDORA SERVER${NC}"
echo -e "${BLUE}========================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_info "Updating Fedora system..."
dnf update -y

# Install required packages
print_info "Installing required packages..."
dnf install -y postgresql postgresql-server postgresql-contrib nginx nodejs npm

# Start and enable PostgreSQL
print_info "Setting up PostgreSQL..."
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql

# Create database and user
print_info "Creating database..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

# Create service user
print_info "Creating service user..."
useradd -r -s /bin/false $SERVICE_USER || true

# Create deployment directory
print_info "Creating deployment directory..."
mkdir -p $DEPLOY_DIR
chown $SERVICE_USER:$SERVICE_USER $DEPLOY_DIR

# Copy application files
print_info "Copying application files..."
cp -r backend $DEPLOY_DIR/
cp -r frontend $DEPLOY_DIR/
cp -r database $DEPLOY_DIR/

# Set permissions
chown -R $SERVICE_USER:$SERVICE_USER $DEPLOY_DIR

# Setup environment variables
print_info "Setting up environment..."
cp $DEPLOY_DIR/backend/.env.template $DEPLOY_DIR/.env

# Create systemd service for backend
print_info "Creating systemd service..."
cat > /etc/systemd/system/maharashtra-survey-backend.service << SERVICEEOF
[Unit]
Description=Maharashtra Survey System Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$DEPLOY_DIR/backend
EnvironmentFile=$DEPLOY_DIR/.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Setup Nginx
print_info "Setting up Nginx..."
cp $DEPLOY_DIR/frontend/nginx.conf /etc/nginx/conf.d/maharashtra-survey.conf
rm -f /etc/nginx/conf.d/default.conf

# Start and enable services
print_info "Starting services..."
systemctl daemon-reload
systemctl enable maharashtra-survey-backend
systemctl start maharashtra-survey-backend
systemctl enable nginx
systemctl start nginx

# Setup firewall
print_info "Configuring firewall..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# Create database schema
print_info "Setting up database schema..."
sudo -u postgres psql -d $DB_NAME -f $DEPLOY_DIR/database/seed.sql

print_status "Deployment completed successfully!"
echo ""
echo -e "${GREEN}🌐 Access your application at: http://your-server-ip${NC}"
echo -e "${GREEN}🔌 Backend API: http://your-server-ip:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update passwords in $DEPLOY_DIR/.env${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Update JWT_SECRET in $DEPLOY_DIR/.env${NC}"
EOF

    chmod +x "$BUILD_DIR/deploy.sh"
    
    # Docker deployment script
    cat > "$BUILD_DIR/deploy-docker.sh" << 'EOF'
#!/bin/bash

# 🐳 DOCKER DEPLOYMENT SCRIPT FOR FEDORA
# Maharashtra Municipal Corporation Survey Management System

set -e

# Configuration
PROJECT_NAME="maharashtra-survey-system"
VERSION="1.0.0"
DEPLOY_DIR="/opt/maharashtra-survey-docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}🐳 DEPLOYING MAHARASHTRA SURVEY SYSTEM WITH DOCKER${NC}"
echo -e "${BLUE}==================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_info "Updating Fedora system..."
dnf update -y

# Install Docker
print_info "Installing Docker..."
dnf install -y docker docker-compose

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Create deployment directory
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Create docker-compose.yml
cat > docker-compose.yml << COMPOSEEOF
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: maharashtra_survey_db
      POSTGRES_USER: survey_user
      POSTGRES_PASSWORD: your_secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/seed.sql:/docker-entrypoint-initdb.d/seed.sql
    ports:
      - "5432:5432"
    networks:
      - survey_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=maharashtra_survey_db
      - DB_USER=survey_user
      - DB_PASSWORD=your_secure_password_here
      - JWT_SECRET=your_very_secure_jwt_secret_key_here
      - JWT_EXPIRES_IN=7d
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - survey_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - survey_network

volumes:
  postgres_data:

networks:
  survey_network:
    driver: bridge
COMPOSEEOF

# Create uploads directory
mkdir -p uploads

# Start services
print_info "Starting services with Docker Compose..."
docker-compose up -d

# Setup firewall
print_info "Configuring firewall..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

print_status "Docker deployment completed successfully!"
echo ""
echo -e "${GREEN}🌐 Access your application at: http://your-server-ip${NC}"
echo -e "${GREEN}🔌 Backend API: http://your-server-ip:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update passwords in docker-compose.yml${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Update JWT_SECRET in docker-compose.yml${NC}"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo -e "${BLUE}   View logs: docker-compose logs -f${NC}"
echo -e "${BLUE}   Stop services: docker-compose down${NC}"
echo -e "${BLUE}   Restart: docker-compose restart${NC}"
EOF

    chmod +x "$BUILD_DIR/deploy-docker.sh"
    
    print_status "Deployment scripts created"
}

# Create package
create_package() {
    print_info "Creating deployment package..."
    
    cd "$BUILD_DIR"
    
    PACKAGE_NAME="${PROJECT_NAME}-${VERSION}-fedora-${TIMESTAMP}"
    tar -czf "../$PACKAGE_DIR/$PACKAGE_NAME.tar.gz" .
    
    cd ..
    
    print_status "Deployment package created: $PACKAGE_NAME.tar.gz"
}

# Main execution
main() {
    echo -e "${BLUE}Starting Fedora deployment package creation...${NC}"
    echo ""
    
    check_prerequisites
    setup_directories
    build_backend
    build_frontend
    create_deployment_scripts
    create_package
    
    echo ""
    echo -e "${GREEN}🎉 FEDORA DEPLOYMENT PACKAGE CREATED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}📦 Package Location:${NC} $PACKAGE_DIR/"
    echo -e "${BLUE}📋 Package Contents:${NC}"
    echo "   • Backend production build"
    echo "   • Frontend production build"
    echo "   • Database setup scripts"
    echo "   • Deployment automation scripts"
    echo "   • Manual and Docker deployment options"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "1. Copy the package to your Fedora server"
    echo "2. Extract and run the deployment script"
    echo "3. Access your application at http://your-server-ip"
    echo ""
    echo -e "${YELLOW}⚠️  Remember to update passwords and JWT secrets!${NC}"
    echo ""
}

# Run main function
main "$@"
