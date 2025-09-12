# GitLab Image Storage Setup Guide

This guide explains how to set up GitLab-based image storage to replace the current base64 storage system.

## Overview

The new system stores images in GitLab repository and serves them through a secure backend proxy, eliminating the API size issues caused by base64 storage.

## Architecture

```
Frontend → Backend → GitLab Repository
    ↓         ↓           ↓
Upload   Proxy/Store   File Storage
Display  Serve Image  Public Access
```

## Setup Steps

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install axios form-data
```

#### Environment Variables
Add these to your `.env` file:
```bash
# GitLab Configuration
GITLAB_PROJECT_ID=74298992
GITLAB_TOKEN=glpat-RcyIulAIuOmFG91q2PgL3G86MQp1Omh5anNkCw.01.120406yei
GITLAB_API_URL=https://gitlab.com/api/v4
GITLAB_REPO_PATH=images/properties
GITLAB_BRANCH=main

# Image Upload Configuration
MAX_IMAGE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp
```

#### Database Migration
Run these SQL scripts in order:
```bash
# 1. Create property_images table
psql -d your_database -f database/migrations/create_property_images_table.sql

# 2. Add image reference columns to properties table
psql -d your_database -f database/migrations/add_image_references_to_properties.sql
```

### 2. GitLab Repository Setup

#### Repository Structure
Your GitLab repository will be organized as:
```
images/
├── properties/
│   ├── {property_id}/
│   │   ├── owner_photo_{timestamp}.jpg
│   │   ├── signature_{timestamp}.png
│   │   └── sketch_photo_{timestamp}.jpg
│   └── {another_property_id}/
│       └── ...
```

#### Token Permissions
Ensure your GitLab token has:
- `read_repository` - To fetch images
- `write_repository` - To upload images
- `api` - To use GitLab API

### 3. Migration of Existing Data

#### Run Migration Script
```bash
cd database/migrations
node migrate_base64_to_gitlab.js
```

This script will:
- Find all properties with base64 images
- Upload images to GitLab
- Create database records
- Update property references
- Generate detailed migration log

### 4. Frontend Updates

#### New Image Upload Flow
```typescript
// Old way (base64)
const base64Data = await fileToBase64(file);
setCapturedPhoto(base64Data);

// New way (GitLab upload)
const uploadResult = await imageApi.uploadImage(file, propertyId, 'owner_photo');
setOwnerPhotoImageId(uploadResult.data.image.id);
```

#### New Image Display
```typescript
// Old way (base64)
<img src={`data:image/jpeg;base64,${base64Data}`} />

// New way (GitLab URL)
<img src={imageApi.generateImageUrl(imageId)} />
```

## API Endpoints

### Image Upload
```
POST /api/images/upload
Content-Type: multipart/form-data
Body: {
  image: File,
  propertyId: string,
  imageType: 'owner_photo' | 'signature' | 'sketch_photo'
}
```

### Image Display
```
GET /api/images/:id
Returns: Image file data with proper headers
```

### Image URL
```
GET /api/images/:id/url
Returns: { image_url: string, file_name: string, mime_type: string }
```

### Property Images
```
GET /api/images/property/:propertyId
Returns: Array of image metadata
```

### Delete Image
```
DELETE /api/images/:id
Returns: Success confirmation
```

## Security Features

### Access Control
- Images are served through backend proxy
- User authentication required
- Role-based access control
- Property ownership validation

### File Validation
- File type validation (images only)
- File size limits (10MB max)
- MIME type checking
- Malicious content scanning

### Token Security
- GitLab token never exposed to frontend
- Server-side authentication only
- Secure API communication

## Performance Optimizations

### Image Compression
- Automatic compression before upload
- Configurable quality settings
- Size optimization
- Format conversion

### Caching
- Browser caching headers
- CDN integration ready
- Backend image caching
- GitLab repository caching

## Error Handling

### Upload Failures
- Retry logic for network issues
- Graceful degradation
- Detailed error logging
- User-friendly error messages

### Display Failures
- Fallback to base64 (during migration)
- Error image placeholder
- Retry mechanisms
- Offline handling

## Monitoring and Logging

### Upload Logs
- Detailed upload progress
- GitLab API responses
- File size and type tracking
- Performance metrics

### Access Logs
- Image request tracking
- User access patterns
- Performance monitoring
- Error rate tracking

## Troubleshooting

### Common Issues

#### GitLab API Errors
- Check token permissions
- Verify project ID
- Confirm repository access
- Check API rate limits

#### Database Issues
- Verify migration scripts ran
- Check foreign key constraints
- Validate image references
- Confirm table structure

#### Frontend Issues
- Check API endpoint URLs
- Verify authentication tokens
- Confirm file upload format
- Check browser console errors

### Debug Commands
```bash
# Test GitLab connection
curl -H "Authorization: Bearer $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/74298992"

# Check database schema
psql -d your_database -c "\d property_images"
psql -d your_database -c "\d properties"

# Test image upload
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "image=@test.jpg" \
  -F "propertyId=test-id" \
  -F "imageType=owner_photo" \
  http://localhost:3000/api/images/upload
```

## Migration Strategy

### Phase 1: Backend Infrastructure
- ✅ GitLab service implementation
- ✅ Image controller and routes
- ✅ Database schema updates
- ✅ Environment configuration

### Phase 2: Data Migration
- ✅ Migration script creation
- 🔄 Run migration for existing data
- 🔄 Verify migrated images
- 🔄 Test image access

### Phase 3: Frontend Updates
- 🔄 Update image upload logic
- 🔄 Modify image display components
- 🔄 Add error handling
- 🔄 Test user workflows

### Phase 4: Testing & Validation
- 🔄 End-to-end testing
- 🔄 Performance testing
- 🔄 Security validation
- 🔄 User acceptance testing

### Phase 5: Cleanup
- 🔄 Remove base64 columns
- 🔄 Clean up legacy code
- 🔄 Update documentation
- 🔄 Performance optimization

## Benefits

### Performance
- ✅ Reduced API payload size
- ✅ Faster page loads
- ✅ Better mobile performance
- ✅ Improved user experience

### Scalability
- ✅ GitLab handles large files
- ✅ CDN-ready architecture
- ✅ Horizontal scaling support
- ✅ Storage optimization

### Security
- ✅ Secure token handling
- ✅ Access control
- ✅ File validation
- ✅ Audit trails

### Maintainability
- ✅ Clean separation of concerns
- ✅ Modular architecture
- ✅ Easy debugging
- ✅ Comprehensive logging

## Next Steps

1. **Run Database Migrations**
2. **Set Up Environment Variables**
3. **Test GitLab Connection**
4. **Run Data Migration Script**
5. **Update Frontend Components**
6. **Test End-to-End Workflow**
7. **Monitor Performance**
8. **Clean Up Legacy Code**

## Support

For issues or questions:
- Check migration logs
- Review error messages
- Test API endpoints
- Verify GitLab access
- Check database schema
