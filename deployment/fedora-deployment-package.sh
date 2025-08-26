#!/bin/bash

# 🚀 FEDORA DEPLOYMENT PACKAGE
# Maharashtra Municipal Corporation Survey Management System
# This script builds production packages locally and deploys to Fedora server

set -e

# Configuration
PROJECT_NAME="maharashtra-survey-system"
VERSION="1.0.0"
BUILD_DIR="./build-packages"
DEPLOY_DIR="./deploy-packages"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏛️  MAHARASHTRA SURVEY SYSTEM - FEDORA DEPLOYMENT PACKAGE${NC}"
echo -e "${BLUE}========================================================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
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
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm -v) detected"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found. Will create manual deployment package instead."
        DOCKER_AVAILABLE=false
    else
        print_status "Docker detected"
        DOCKER_AVAILABLE=true
    fi
    
    # Check tar
    if ! command -v tar &> /dev/null; then
        print_error "tar is not installed"
        exit 1
    fi
    print_status "tar detected"
}

# Clean previous builds
clean_builds() {
    print_info "Cleaning previous build artifacts..."
    rm -rf "$BUILD_DIR" "$DEPLOY_DIR"
    mkdir -p "$BUILD_DIR" "$DEPLOY_DIR"
    print_status "Build directories cleaned"
}

# Build backend package
build_backend() {
    print_info "Building backend production package..."
    
    cd backend
    
    # Install production dependencies
    print_info "Installing production dependencies..."
    npm ci --only=production
    
    # Create production build directory
    mkdir -p "../$BUILD_DIR/backend"
    
    # Copy production files
    cp -r src ../$BUILD_DIR/backend/
    cp package.json ../$BUILD_DIR/backend/
    cp package-lock.json ../$BUILD_DIR/backend/
    cp -r node_modules ../$BUILD_DIR/backend/
    
    # Create production environment file
    cat > "../$BUILD_DIR/backend/.env" << EOF
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
    
    # Create production start script
    cat > "../$BUILD_DIR/backend/start.sh" << 'EOF'
#!/bin/bash
echo "Starting Maharashtra Survey System Backend..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"

# Create uploads directory if it doesn't exist
mkdir -p /app/uploads

# Start the application
exec node src/server.js
EOF
    
    chmod +x "../$BUILD_DIR/backend/start.sh"
    
    cd ..
    print_status "Backend package built successfully"
}

# Build frontend package
build_frontend() {
    print_info "Building frontend production package..."
    
    cd web-dashboard
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm ci
    
    # Build production version
    print_info "Building production bundle..."
    npm run build
    
    # Create production package directory
    mkdir -p "../$BUILD_DIR/frontend"
    
    # Copy built files
    cp -r dist/* "../$BUILD_DIR/frontend/"
    
    # Create nginx configuration for production
    cat > "../$BUILD_DIR/frontend/nginx.conf" << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
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
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    cd ..
    print_status "Frontend package built successfully"
}

# Build Docker images (if available)
build_docker_images() {
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_info "Building Docker production images..."
        
        # Build backend image
        print_info "Building backend Docker image..."
        docker build -t maharashtra-survey-backend:$VERSION ./backend
        
        # Build frontend image
        print_info "Building frontend Docker image..."
        docker build -t maharashtra-survey-frontend:$VERSION ./web-dashboard
        
        # Save images as tar files
        print_info "Saving Docker images..."
        docker save maharashtra-survey-backend:$VERSION | gzip > "$BUILD_DIR/backend-image.tar.gz"
        docker save maharashtra-survey-frontend:$VERSION | gzip > "$BUILD_DIR/frontend-image.tar.gz"
        
        print_status "Docker images built and saved"
    else
        print_warning "Skipping Docker build (Docker not available)"
    fi
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
dnf install -y postgresql postgresql-server postgresql-contrib nginx nodejs npm git

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
cat > $DEPLOY_DIR/.env << ENVEOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
UPLOAD_PATH=$DEPLOY_DIR/backend/uploads
ENVEOF

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

# Remove default nginx site
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
    
    # Docker deployment script (if Docker images were built)
    if [ "$DOCKER_AVAILABLE" = true ]; then
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

# Load Docker images
print_info "Loading Docker images..."
docker load < backend-image.tar.gz
docker load < frontend-image.tar.gz

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
    image: maharashtra-survey-backend:$VERSION
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
    image: maharashtra-survey-frontend:$VERSION
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
    fi
    
    print_status "Deployment scripts created"
}

# Create package archive
create_package() {
    print_info "Creating deployment package..."
    
    cd "$BUILD_DIR"
    
    # Create package name
    PACKAGE_NAME="${PROJECT_NAME}-${VERSION}-fedora-${TIMESTAMP}"
    
    # Create tar.gz package
    tar -czf "../$DEPLOY_DIR/$PACKAGE_NAME.tar.gz" .
    
    cd ..
    
    print_status "Deployment package created: $PACKAGE_NAME.tar.gz"
}

# Create documentation
create_documentation() {
    print_info "Creating deployment documentation..."
    
    cat > "$BUILD_DIR/README-DEPLOYMENT.md" << 'DOCEOF'
# 🚀 FEDORA DEPLOYMENT GUIDE
## Maharashtra Municipal Corporation Survey Management System

### 📦 Package Contents
This package contains everything needed to deploy the Maharashtra Survey System on a Fedora server:

- **Backend**: Production-ready Node.js application
- **Frontend**: Built React.js application with Nginx configuration
- **Database**: PostgreSQL setup scripts and initial data
- **Deployment Scripts**: Automated deployment for both manual and Docker setups

### 🎯 Deployment Options

#### Option 1: Manual Deployment (Recommended for Production)
```bash
# 1. Extract the package
tar -xzf maharashtra-survey-system-*.tar.gz
cd maharashtra-survey-system-*

# 2. Run deployment script (requires root)
sudo ./deploy.sh
```

#### Option 2: Docker Deployment (Easier, Good for Development)
```bash
# 1. Extract the package
tar -xzf maharashtra-survey-system-*.tar.gz
cd maharashtra-survey-system-*

# 2. Run Docker deployment script (requires root)
sudo ./deploy-docker.sh
```

### 🔧 Pre-deployment Requirements

#### System Requirements
- **OS**: Fedora 35+ (or RHEL 8+, CentOS 8+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **Network**: Internet access for package installation

#### Software Dependencies
- **PostgreSQL**: 12+ (automatically installed)
- **Node.js**: 18+ (automatically installed)
- **Nginx**: Latest version (automatically installed)
- **Docker**: Latest version (for Docker deployment only)

### 🚀 Quick Start

1. **Download and extract** the deployment package
2. **Choose deployment method** (manual or Docker)
3. **Run deployment script** with sudo privileges
4. **Access application** at http://your-server-ip
5. **Update credentials** in configuration files

### 🔐 Security Configuration

#### Required Updates
- **Database Password**: Update in .env or docker-compose.yml
- **JWT Secret**: Generate new secure random string
- **Firewall Rules**: Configure based on your network requirements

#### Security Best Practices
- Use strong, unique passwords
- Enable HTTPS with SSL certificates
- Restrict database access to application only
- Regular security updates
- Monitor system logs

### 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Field Executive│───▶│   Web Dashboard  │───▶│ Municipal Officer│
│   (Mobile)      │    │   (Nginx + React)│    │   (Desktop)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │◀───│   Backend API    │───▶│  File Storage   │
│   Database      │    │   (Node.js)      │    │   (Uploads)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🆘 Troubleshooting

#### Common Issues
1. **Port conflicts**: Check if ports 80, 3000, 5432 are available
2. **Permission errors**: Ensure running deployment script as root
3. **Database connection**: Verify PostgreSQL is running and accessible
4. **Service startup**: Check systemd service status and logs

#### Log Locations
- **Backend**: journalctl -u maharashtra-survey-backend
- **Nginx**: journalctl -u nginx
- **PostgreSQL**: journalctl -u postgresql

#### Support Commands
```bash
# Check service status
systemctl status maharashtra-survey-backend
systemctl status nginx
systemctl status postgresql

# View logs
journalctl -u maharashtra-survey-backend -f
journalctl -u nginx -f

# Restart services
systemctl restart maharashtra-survey-backend
systemctl restart nginx
```

### 📞 Support & Contact

- **System Version**: v$VERSION
- **Last Updated**: $(date)
- **Compatible with**: Fedora 35+, RHEL 8+, CentOS 8+
- **Documentation**: See individual README files in component directories

---

## 🎉 Your Municipal Survey System is Ready for Production!

This deployment package provides a complete, production-ready installation of the Maharashtra Municipal Corporation Survey Management System on Fedora servers.
DOCEOF

    print_status "Documentation created"
}

# Main execution
main() {
    echo -e "${BLUE}Starting Fedora deployment package creation...${NC}"
    echo ""
    
    check_prerequisites
    clean_builds
    build_backend
    build_frontend
    build_docker_images
    create_deployment_scripts
    create_documentation
    create_package
    
    echo ""
    echo -e "${GREEN}🎉 FEDORA DEPLOYMENT PACKAGE CREATED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}📦 Package Location:${NC} $DEPLOY_DIR/"
    echo -e "${BLUE}📋 Package Contents:${NC}"
    echo "   • Backend production build"
    echo "   • Frontend production build"
    echo "   • Database setup scripts"
    echo "   • Deployment automation scripts"
    echo "   • Comprehensive documentation"
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "   • Docker production images"
    fi
    
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
