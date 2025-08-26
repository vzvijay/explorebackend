# 🚀 FEDORA DEPLOYMENT PACKAGE
## Maharashtra Municipal Corporation Survey Management System

### 📦 Package Overview
This deployment package contains everything needed to deploy the Maharashtra Survey System on a Fedora server. It follows DevOps best practices by providing pre-built production packages rather than requiring source code compilation on the server.

### 🎯 What This System Does
The **Maharashtra Municipal Corporation Survey Management System** is a comprehensive digital solution that:

- **Replaces paper-based surveys** with modern digital forms
- **Enables real-time property management** for municipal officers
- **Provides mobile access** for field executives conducting surveys
- **Automates tax calculations** and assessment processes
- **Offers role-based access control** for different user types
- **Captures GPS coordinates** and property photos
- **Generates comprehensive reports** and analytics

### 🏗️ System Architecture
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

### 📋 Package Contents
```
maharashtra-survey-system-1.0.0-fedora-YYYYMMDD_HHMMSS.tar.gz
├── backend/                    # Production-ready Node.js backend
│   ├── src/                   # Application source code
│   ├── node_modules/          # Production dependencies
│   ├── package.json           # Dependencies manifest
│   ├── .env.template          # Environment configuration template
│   └── start.sh              # Production start script
├── frontend/                   # Built React.js application
│   ├── static/                # Compiled assets
│   ├── index.html             # Main application entry
│   └── nginx.conf             # Nginx configuration
├── database/                   # Database setup files
│   └── seed.sql               # Initial schema and data
├── deploy.sh                   # Manual deployment script
├── deploy-docker.sh           # Docker deployment script
├── frontend.Dockerfile        # Frontend container definition
├── backend.Dockerfile         # Backend container definition
└── README-DEPLOYMENT.md       # This documentation
```

### 🚀 Deployment Options

#### Option 1: Manual Deployment (Recommended for Production)
**Best for**: Production servers, security-focused environments, custom configurations

**Advantages**:
- Full control over system configuration
- Better security isolation
- Easier troubleshooting and monitoring
- Native system integration

**Requirements**:
- Fedora 35+ (or RHEL 8+, CentOS 8+)
- Root access (sudo privileges)
- Internet connection for package installation

#### Option 2: Docker Deployment (Easier, Good for Development)
**Best for**: Development environments, quick deployments, containerized infrastructure

**Advantages**:
- Faster deployment
- Consistent environment across servers
- Easy scaling and updates
- Built-in service orchestration

**Requirements**:
- Fedora 35+ (or RHEL 8+, CentOS 8+)
- Root access (sudo privileges)
- Internet connection for Docker installation

### 🔧 Pre-deployment Requirements

#### System Requirements
- **Operating System**: Fedora 35+ (or RHEL 8+, CentOS 8+)
- **Memory**: Minimum 4GB RAM, Recommended 8GB+
- **Storage**: Minimum 20GB free disk space
- **Network**: Internet access for package installation
- **Architecture**: x86_64 (64-bit)

#### Software Dependencies (Automatically Installed)
- **PostgreSQL**: 12+ database server
- **Node.js**: 18+ runtime environment
- **Nginx**: Latest web server and reverse proxy
- **Docker**: Latest container runtime (Docker deployment only)

### 🚀 Quick Start Guide

#### Step 1: Prepare Your Fedora Server
```bash
# Update system
sudo dnf update -y

# Ensure you have root access
sudo whoami
```

#### Step 2: Transfer and Extract Package
```bash
# Copy package to server (from your local machine)
scp maharashtra-survey-system-*.tar.gz user@your-server-ip:/tmp/

# On the server, extract the package
cd /tmp
tar -xzf maharashtra-survey-system-*.tar.gz
cd maharashtra-survey-system-*
```

#### Step 3: Choose Deployment Method

**For Manual Deployment:**
```bash
# Run the deployment script
sudo ./deploy.sh
```

**For Docker Deployment:**
```bash
# Run the Docker deployment script
sudo ./deploy-docker.sh
```

#### Step 4: Access Your Application
- **Web Dashboard**: http://your-server-ip
- **Backend API**: http://your-server-ip:3000

### 🔐 Security Configuration

#### Required Updates
After deployment, you **MUST** update these security settings:

1. **Database Password**:
   ```bash
   # Edit environment file
   sudo nano /opt/maharashtra-survey/.env
   
   # Update this line:
   DB_PASSWORD=your_new_secure_password_here
   ```

2. **JWT Secret**:
   ```bash
   # Generate a new secure secret
   openssl rand -base64 64
   
   # Update in environment file
   JWT_SECRET=your_new_generated_secret_here
   ```

3. **Firewall Rules**:
   ```bash
   # Review and customize firewall rules
   sudo firewall-cmd --list-all
   ```

#### Security Best Practices
- Use strong, unique passwords (16+ characters)
- Enable HTTPS with SSL certificates
- Restrict database access to application only
- Regular security updates
- Monitor system logs and access
- Use non-root service users
- Implement rate limiting

### 📊 User Management

#### Default Users (Change Immediately)
The system comes with these default users for initial setup:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@maharashtra.gov.in | password123 | Full system access |
| Municipal Officer | officer@maharashtra.gov.in | password123 | Survey management |
| Engineer | engineer@maharashtra.gov.in | password123 | Technical validation |
| Field Executive | field1@maharashtra.gov.in | password123 | Survey creation |

#### Creating New Users
```bash
# Access PostgreSQL
sudo -u postgres psql -d maharashtra_survey_db

# Create new user
INSERT INTO users (email, password, role, name) 
VALUES ('newuser@example.com', 'hashed_password', 'field_executive', 'New User');

# Exit
\q
```

### 🆘 Troubleshooting

#### Common Issues and Solutions

**1. Port Conflicts**
```bash
# Check what's using the ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5432

# Kill conflicting processes
sudo kill -9 <PID>
```

**2. Service Startup Failures**
```bash
# Check service status
sudo systemctl status maharashtra-survey-backend
sudo systemctl status nginx
sudo systemctl status postgresql

# View logs
sudo journalctl -u maharashtra-survey-backend -f
sudo journalctl -u nginx -f
```

**3. Database Connection Issues**
```bash
# Test database connectivity
sudo -u postgres psql -d maharashtra_survey_db -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l
```

**4. Permission Errors**
```bash
# Fix file permissions
sudo chown -R survey-system:survey-system /opt/maharashtra-survey
sudo chmod -R 755 /opt/maharashtra-survey
```

#### Log Locations
- **Backend Logs**: `journalctl -u maharashtra-survey-backend -f`
- **Nginx Logs**: `journalctl -u nginx -f`
- **PostgreSQL Logs**: `journalctl -u postgresql -f`
- **System Logs**: `/var/log/messages`

### 📈 Monitoring and Maintenance

#### Health Checks
```bash
# Check application health
curl http://localhost:3000/health

# Check database connectivity
sudo -u postgres psql -d maharashtra_survey_db -c "SELECT version();"

# Check disk space
df -h

# Check memory usage
free -h
```

#### Backup Procedures
```bash
# Database backup
sudo -u postgres pg_dump maharashtra_survey_db > backup_$(date +%Y%m%d).sql

# Application backup
sudo tar -czf app_backup_$(date +%Y%m%d).tar.gz /opt/maharashtra-survey

# Uploads backup
sudo tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/maharashtra-survey/backend/uploads
```

#### Update Procedures
```bash
# Stop services
sudo systemctl stop maharashtra-survey-backend
sudo systemctl stop nginx

# Backup current installation
sudo cp -r /opt/maharashtra-survey /opt/maharashtra-survey_backup

# Extract new package
sudo tar -xzf new_package.tar.gz -C /opt/

# Restart services
sudo systemctl start maharashtra-survey-backend
sudo systemctl start nginx
```

### 🌐 Network Configuration

#### Firewall Setup
```bash
# View current firewall rules
sudo firewall-cmd --list-all

# Add custom rules if needed
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

#### SSL/HTTPS Setup
```bash
# Install Certbot for Let's Encrypt
sudo dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 📞 Support and Contact

#### System Information
- **Version**: 1.0.0
- **Last Updated**: $(date)
- **Compatible OS**: Fedora 35+, RHEL 8+, CentOS 8+
- **Architecture**: x86_64

#### Documentation
- **API Documentation**: Available at `/api/docs` after deployment
- **User Manual**: Built into the web dashboard
- **Technical Docs**: See individual component README files

#### Getting Help
1. Check the troubleshooting section above
2. Review system logs for error details
3. Verify configuration files and permissions
4. Test individual components in isolation

---

## 🎉 Your Municipal Survey System is Ready for Production!

This deployment package provides a complete, production-ready installation of the Maharashtra Municipal Corporation Survey Management System on Fedora servers. 

**Key Benefits**:
- ✅ **Zero-downtime deployment** with automated scripts
- ✅ **Production-optimized** builds and configurations
- ✅ **Security-focused** setup with best practices
- ✅ **Easy maintenance** with systemd services
- ✅ **Scalable architecture** ready for growth
- ✅ **Comprehensive monitoring** and logging

**Next Steps**:
1. Deploy to your Fedora server
2. Update security credentials
3. Configure SSL certificates
4. Set up monitoring and backups
5. Train your municipal staff

**Remember**: This system transforms your manual paper-based survey process into a modern, efficient digital workflow that saves time, reduces errors, and provides real-time municipal management capabilities.
