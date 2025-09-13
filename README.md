# Maharashtra Municipal Corporation Survey Management System

## Overview
A comprehensive digital solution for property survey and tax assessment, replacing manual paper-based processes with a modern mobile and web application system.

## System Architecture

### Frontend Applications
- **Mobile App**: React Native app for field executives
- **Web Dashboard**: React.js admin panel for municipal officers and engineers

### Backend Services
- **API Server**: Node.js/Express REST API
- **Database**: PostgreSQL with spatial extensions
- **File Storage**: Local/Cloud storage for property images
- **Authentication**: JWT-based auth with role-based access control

## User Roles & Permissions

### 1. Admin
- Full system access
- User management
- System configuration
- Data backup/restore

### 2. Municipal Officer (Head)
- View all survey data
- Generate reports
- Approve/reject submissions
- Monitor field executive performance

### 3. Engineer
- Access filled survey details
- Technical validation
- Area calculations verification
- Generate technical reports

### 4. Field Executive
- Fill property survey forms
- Capture property images
- GPS location marking
- Submit surveys for approval

## Survey Data Structure

Based on the provided form, the system captures:

### Property Details
- Property ID/Survey Number
- Owner Name & Contact
- Property Address
- Property Type (Residential/Commercial/Industrial)

### Area Measurements
- Carpet Area (sq ft/sq m)
- Built-up Area (sq ft/sq m)
- Plot Area
- Construction details

### Tax Assessment
- Property valuation
- Tax calculation based on area
- Payment status
- Assessment year

### Additional Information
- Construction year
- Number of floors
- Utilities (water, electricity, sewage)
- Property photos
- GPS coordinates

## Technology Stack

### Mobile App
- React Native
- Redux for state management
- React Navigation
- Camera integration
- GPS location services

### Web Dashboard
- React.js
- Material-UI components
- Chart.js for analytics
- Google Maps integration

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- bcrypt for password hashing

### DevOps
- Docker containerization
- PM2 for process management
- Nginx reverse proxy
- SSL/TLS security

## Features

### Mobile App Features
- Digital form filling
- Property photo capture
- GPS location tagging
- Signature capture
- Data validation
- Sync management

### Web Dashboard Features
- Real-time survey progress tracking
- Interactive maps with survey locations
- Analytics and reporting
- User management
- Data export capabilities
- Tax calculation engine

## Installation and Setup

See individual README files in respective directories:
- `/mobile-app/README.md`
- `/web-dashboard/README.md`
- `/backend/README.md`

## Project Structure

```
maharashtra-survey-system/
├── mobile-app/           # React Native mobile application
├── web-dashboard/        # React.js web application
├── backend/             # Node.js API server
├── database/            # PostgreSQL schemas and migrations
├── docs/               # Project documentation
└── deployment/         # Docker and deployment configurations
```

## Development Timeline

- Phase 1: Backend API and Database (Week 1-2)
- Phase 2: Web Dashboard (Week 3-4)
- Phase 3: Mobile Application (Week 5-6)
- Phase 4: Testing and Deployment (Week 7-8)

## Contact
For technical support or questions, please contact the development team. 