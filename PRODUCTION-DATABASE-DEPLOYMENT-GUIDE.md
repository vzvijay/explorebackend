# 🚀 Production Database Deployment Guide

## Overview
This guide will help you deploy your local database changes to your Render PostgreSQL production database.

## ⚠️ IMPORTANT: Backup First!
**Before running any migration, create a backup of your production database!**

## Prerequisites
- Access to your Render PostgreSQL database
- Database connection details (host, port, database name, username, password)
- `psql` command-line tool or a PostgreSQL client

## Deployment Steps

### Step 1: Get Your Render Database Connection Details

1. Go to your Render dashboard
2. Navigate to your PostgreSQL service
3. Copy the connection details:
   - **Host**: `your-db-host.onrender.com`
   - **Port**: `5432` (usually)
   - **Database**: `your-database-name`
   - **Username**: `your-username`
   - **Password**: `your-password`

### Step 2: Connect to Your Production Database

```bash
# Using psql command line
psql "postgresql://username:password@host:port/database"

# Or using connection string
psql "postgresql://username:password@your-db-host.onrender.com:5432/your-database-name"
```

### Step 3: Run the Migration Script

```bash
# Option 1: Run the script directly
psql "postgresql://username:password@host:port/database" -f production-database-deployment.sql

# Option 2: Copy and paste the script content into your PostgreSQL client
```

### Step 4: Verify the Deployment

The script includes verification queries that will show:
- ✅ Schema changes applied
- ✅ Data integrity maintained
- ✅ Sample data verification
- ✅ Success confirmation

## What the Migration Does

### 1. Schema Fix
- Adds `property_id` column to `properties` table
- Generates unique property IDs (PROP-2025-001, PROP-2025-002, etc.)
- Updates `property_images` table to use string-based property IDs

### 2. GitLab-Only Storage
- Removes base64 columns (`owner_tenant_photo`, `signature_data`, `sketch_photo`)
- Prepares database for GitLab-only image storage

### 3. Image ID Types
- Changes image ID columns from UUID to VARCHAR(100)
- Removes foreign key constraints to allow GitLab image IDs

### 4. Performance Optimization
- Creates indexes for better query performance
- Cleans up orphaned data

## Expected Results

After successful deployment, you should see:

```
🎉 Production database deployment completed successfully!
✅ All schema changes applied
✅ GitLab-only storage enabled
✅ Image ID types updated
✅ Data integrity verified
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure your database user has ALTER TABLE permissions
   - Contact Render support if needed

2. **Foreign Key Constraint Errors**
   - The script handles this by dropping constraints first
   - If issues persist, check for orphaned data

3. **Connection Timeout**
   - Render databases may have connection limits
   - Try running the script in smaller chunks if needed

### Rollback Plan

If you need to rollback:
1. Restore from your backup
2. Contact support if backup is not available

## Post-Deployment

After successful deployment:

1. **Update your backend environment variables** to point to production
2. **Test the application** with the new schema
3. **Verify image uploads** work with GitLab storage
4. **Monitor performance** and adjust indexes if needed

## Support

If you encounter any issues:
1. Check the Render logs
2. Verify connection details
3. Contact Render support if needed

---

**Remember**: Always backup your production database before making changes!
