# 🚀 DEPLOYMENT PACKAGE
## Maharashtra Municipal Corporation Survey Management System

### 📦 Complete Setup in 5 Commands

```bash
# 1. Download or clone this project
git clone <your-repo-url>
cd maharashtra-survey-system

# 2. Install dependencies
./quick-setup.sh

# 3. Setup database
./setup-database.sh

# 4. Start services
./start-services.sh

# 5. Open application
# Automatically opens at http://localhost:3001
```

### 🎯 READY TO USE!

**🔗 Access the System:** `http://localhost:3001`

**📱 Login Credentials:**
- **Field Executive:** `field1@maharashtra.gov.in` / `password123`
- **Municipal Officer:** `officer@maharashtra.gov.in` / `password123`
- **Admin:** `admin@maharashtra.gov.in` / `password123`
- **Engineer:** `engineer@maharashtra.gov.in` / `password123`

### 📋 Quick Usage Guide

#### For Field Executives (Mobile Users):
1. Login with field executive credentials
2. Click **"New Survey"** button (only visible to field executives)
3. Fill the 4-step survey form:
   - Step 1: Property & Owner Information
   - Step 2: Property Details & Measurements
   - Step 3: GPS Location & Photos
   - Step 4: Review & Submit
4. Submit for municipal review

#### For Municipal Officers:
1. Login with municipal officer credentials  
2. Go to **"Properties"** tab
3. View all submitted surveys
4. Click **"View"** to see complete property details
5. **Approve** or **Reject** surveys
6. Dashboard automatically updates with real-time statistics

### 🛠️ Management Commands

```bash
# Stop all services
./kill-services.sh

# Restart services
./start-services.sh

# View logs
tail -f backend.log    # Backend API logs
tail -f frontend.log   # Frontend logs
```

### ✨ Features Included

✅ **Complete Digital Survey Form** - 4-step wizard with validation  
✅ **Real-time Dashboard** - Auto-updates every 30 seconds  
✅ **GPS Location Capture** - Automatic property coordinates  
✅ **Photo Upload System** - Property images and documents  
✅ **Role-Based Access Control** - Different views for each role  
✅ **Tax Calculation Engine** - Automatic tax assessment  
✅ **Review & Approval System** - Municipal officer workflow  
✅ **Mobile Responsive Design** - Works on phones, tablets, computers  
✅ **Comprehensive Reporting** - Statistics and property management  

### 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Field Executive│───▶│   Web Dashboard  │───▶│ Municipal Officer│
│   (Mobile)      │    │   (React.js)     │    │   (Desktop)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │◀───│   Backend API    │───▶│  File Storage   │
│   Database      │    │   (Node.js)      │    │   (Images)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🆘 Troubleshooting

**Problem:** Port already in use
```bash
./kill-services.sh
./start-services.sh
```

**Problem:** Database connection error
```bash
./setup-database.sh
```

**Problem:** Permission denied
```bash
chmod +x *.sh
```

**Problem:** PostgreSQL not found
- **macOS:** `brew install postgresql`
- **Ubuntu:** `sudo apt-get install postgresql postgresql-contrib`
- **Windows:** Download from postgresql.org

### 📞 Support & Contact

- **System Version:** v1.0
- **Last Updated:** August 2024
- **Compatible with:** Node.js 16+, PostgreSQL 12+
- **Platforms:** macOS, Linux, Windows (WSL)

---

## 🎉 Your Paper-Based Survey Process is Now Fully Digital!

**Before:** Manual paper forms → Physical delivery → Manual data entry → Delays  
**After:** Digital forms → Real-time submission → Automatic processing → Instant updates

The system replaces your cumbersome manual process with a modern, efficient digital workflow that saves time, reduces errors, and provides real-time municipal management capabilities. 