/**
 * Migration Script: Convert Base64 Images to GitLab Storage
 * 
 * This script migrates existing base64 image data from the properties table
 * to the new GitLab-based storage system.
 * 
 * Usage:
 * 1. Run database migrations first (create_property_images_table.sql, add_image_references_to_properties.sql)
 * 2. Set up GitLab environment variables
 * 3. Run: node database/migrations/migrate_base64_to_gitlab.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });
const { Property, PropertyImage, User } = require('../../backend/src/models');
const gitlabService = require('../../backend/src/services/gitlabService');
const fs = require('fs');
const path = require('path');

class Base64ToGitLabMigrator {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
    this.errors = [];
    this.logFile = path.join(__dirname, `migration_log_${new Date().toISOString().split('T')[0]}.txt`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async migratePropertyImages(property) {
    const propertyId = property.id;
    const propertyNumber = property.survey_number || property.property_id;
    
    this.log(`🔄 Processing property: ${propertyNumber} (${propertyId})`);

    try {
      // Migrate owner photo
      if (property.owner_tenant_photo) {
        await this.migrateImage(
          property,
          property.owner_tenant_photo,
          'owner_photo',
          'owner_photo.jpg',
          propertyId
        );
      }

      // Migrate signature
      if (property.signature_data) {
        await this.migrateImage(
          property,
          property.signature_data,
          'signature',
          'signature.png',
          propertyId
        );
      }

      // Migrate sketch photo
      if (property.sketch_photo) {
        await this.migrateImage(
          property,
          property.sketch_photo,
          'sketch_photo',
          'sketch_photo.jpg',
          propertyId
        );
      }

      this.migratedCount++;
      this.log(`✅ Successfully migrated property: ${propertyNumber}`);

    } catch (error) {
      this.errorCount++;
      const errorMsg = `❌ Error migrating property ${propertyNumber}: ${error.message}`;
      this.log(errorMsg);
      this.errors.push({
        propertyId,
        propertyNumber,
        error: error.message
      });
    }
  }

  async migrateImage(property, base64Data, imageType, fileName, propertyId) {
    try {
      // Clean base64 data (remove data URL prefix if present)
      let cleanBase64 = base64Data;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(cleanBase64, 'base64');
      
      if (imageBuffer.length === 0) {
        throw new Error('Empty image data');
      }

      this.log(`📤 Uploading ${imageType} for property ${property.survey_number} (${imageBuffer.length} bytes)`);

      // Upload to GitLab
      const uploadResult = await gitlabService.uploadImage(
        imageBuffer,
        fileName,
        propertyId,
        imageType
      );

      // Create database record
      const imageRecord = await PropertyImage.create({
        property_id: propertyId,
        image_type: imageType,
        gitlab_file_path: uploadResult.gitlabFilePath,
        gitlab_url: uploadResult.gitlabUrl,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        uploaded_by: property.surveyed_by // Use the original surveyor
      });

      // Update property with image reference
      const updateField = `${imageType}_image_id`;
      await property.update({
        [updateField]: imageRecord.id
      });

      this.log(`✅ Successfully migrated ${imageType} for property ${property.survey_number}`);

    } catch (error) {
      throw new Error(`Failed to migrate ${imageType}: ${error.message}`);
    }
  }

  async run() {
    this.log('🚀 Starting Base64 to GitLab migration...');
    this.log(`📁 Log file: ${this.logFile}`);

    try {
      // Get all properties with base64 images
      const properties = await Property.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { owner_tenant_photo: { [require('sequelize').Op.ne]: null } },
            { signature_data: { [require('sequelize').Op.ne]: null } },
            { sketch_photo: { [require('sequelize').Op.ne]: null } }
          ]
        },
        include: [
          {
            model: User,
            as: 'surveyor',
            attributes: ['first_name', 'last_name', 'employee_id']
          }
        ]
      });

      this.log(`📊 Found ${properties.length} properties with base64 images`);

      if (properties.length === 0) {
        this.log('✅ No properties with base64 images found. Migration complete.');
        return;
      }

      // Process each property
      for (const property of properties) {
        await this.migratePropertyImages(property);
        
        // Add small delay to avoid overwhelming GitLab API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate summary
      this.log('\n📊 Migration Summary:');
      this.log(`✅ Successfully migrated: ${this.migratedCount} properties`);
      this.log(`❌ Errors: ${this.errorCount} properties`);
      
      if (this.errors.length > 0) {
        this.log('\n❌ Errors encountered:');
        this.errors.forEach(error => {
          this.log(`  - ${error.propertyNumber}: ${error.error}`);
        });
      }

      this.log('\n🎉 Migration completed!');
      this.log(`📁 Detailed log saved to: ${this.logFile}`);

    } catch (error) {
      this.log(`💥 Migration failed: ${error.message}`);
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new Base64ToGitLabMigrator();
  
  migrator.run()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = Base64ToGitLabMigrator;
