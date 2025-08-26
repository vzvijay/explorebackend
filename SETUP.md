# 🏛️ Maharashtra Municipal Corporation Survey Management System
## Quick Setup Guide

### Prerequisites
- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (version 12 or higher) - [Download here](https://www.postgresql.org/download/)

### ⚡ Quick Start (5 Commands)

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd maharashtra-survey-system
   ```

2. **Install Dependencies:**
   ```bash
   chmod +x quick-setup.sh && ./quick-setup.sh
   ```

3. **Setup Database:**
   ```bash
   ./setup-database.sh
   ```

4. **Start Services:**
   ```bash
   ./start-services.sh
   ```

5. **Open Application:**
   ```bash
   open http://localhost:3001
   ```

### 📱 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@maharashtra.gov.in | password123 |
| Municipal Officer | officer@maharashtra.gov.in | password123 |
| Engineer | engineer@maharashtra.gov.in | password123 |
| Field Executive | field1@maharashtra.gov.in | password123 |

### 🎯 How to Use

#### For Field Executives:
1. Login with field executive credentials
2. Click **"New Survey"** button
3. Fill the 4-step digital survey form
4. Submit for review

#### For Municipal Officers:
1. Login with municipal officer credentials
2. Go to **"Properties"** tab
3. Review submitted surveys
4. Approve or reject surveys

### 🔧 Manual Setup (If Quick Setup Fails)

#### 1. Backend Setup:
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npm run migrate
npm start
```

#### 2. Frontend Setup:
```bash
cd web-dashboard
npm install
npm run dev
```

#### 3. Database Setup:
```bash
# Create database
createdb maharashtra_survey_db

# Create user
createuser -s survey_user

# Run setup script
node backend/create-users.js
```

### 📊 System Features

✅ **Digital Survey Forms** - Replace paper-based surveys  
✅ **GPS Location Capture** - Automatic property coordinates  
✅ **Photo Upload** - Property images and documents  
✅ **Role-Based Access** - Admin, Officer, Engineer, Field Executive  
✅ **Real-time Dashboard** - Live statistics and updates  
✅ **Tax Calculation** - Automatic tax assessment  
✅ **Review System** - Approve/reject surveys  
✅ **Mobile Responsive** - Works on phones and tablets  

### 🚀 Production Deployment

For production deployment, see `docker-compose.yml` or contact system administrator.

### 🆘 Troubleshooting

**Port 3000 already in use:**
```bash
./kill-services.sh
./start-services.sh
```

**Database connection error:**
```bash
./setup-database.sh
```

**Permission denied:**
```bash
chmod +x *.sh
```

### 📞 Support

For technical support or questions, contact your system administrator.

---
**Maharashtra Municipal Corporation Survey Management System v1.0** 