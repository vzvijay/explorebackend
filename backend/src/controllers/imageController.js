const { PropertyImage, Property } = require('../models');
const gitlabService = require('../services/gitlabService');
const { validationResult } = require('express-validator');
const getEnvironmentConfig = require('../config/environment');
const config = getEnvironmentConfig();

/**
 * Clean up old image of specific type for a property
 * @param {string} propertyId - Property ID
 * @param {string} imageType - Type of image (owner_photo, signature, sketch_photo)
 * @returns {Promise<void>}
 */
const cleanupOldImage = async (propertyId, imageType) => {
  try {
    console.log(`🧹 Cleaning up old ${imageType} for property: ${propertyId}`);
    
    // Find existing image of this type for this property
    const oldImage = await PropertyImage.findOne({
      where: { 
        property_id: propertyId, 
        image_type: imageType 
      }
    });
    
    if (oldImage) {
      console.log(`🗑️ Found old ${imageType}: ${oldImage.gitlab_file_path}`);
      
      try {
        // Delete from GitLab
        await gitlabService.deleteImage(oldImage.gitlab_file_path);
        console.log(`✅ Deleted old ${imageType} from GitLab`);
        
        // Delete from database
        await oldImage.destroy();
        console.log(`✅ Deleted old ${imageType} from database`);
        
      } catch (deleteError) {
        console.error(`❌ Error deleting old ${imageType}:`, deleteError.message);
        // Don't throw error - continue with new upload even if cleanup fails
      }
    } else {
      console.log(`ℹ️ No old ${imageType} found for property: ${propertyId}`);
    }
    
  } catch (error) {
    console.error(`❌ Error in cleanupOldImage:`, error.message);
    // Don't throw error - continue with new upload even if cleanup fails
  }
};

/**
 * Upload image to GitLab and store metadata in database
 */
const uploadImage = async (req, res) => {
  try {
    // Image upload request received
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { propertyId, imageType } = req.body;
    
    // Validate required fields
    if (!propertyId || !imageType) {
      return res.status(400).json({
        success: false,
        message: 'Property ID and image type are required'
      });
    }

    // Validate image type
    const validImageTypes = ['owner_photo', 'signature', 'sketch_photo'];
    if (!validImageTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type. Must be one of: owner_photo, signature, sketch_photo'
      });
    }

    // Validate file
    const validation = gitlabService.validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Clean up old image of the same type if uploading a new one
    await cleanupOldImage(propertyId, imageType);

    // Uploading image for property

    // Upload to GitLab directly with property_id
    const uploadResult = await gitlabService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      propertyId,
      imageType
    );

    // Store metadata in database
    const imageRecord = await PropertyImage.create({
      property_id: propertyId, // Store property_id directly
      image_type: imageType,
      gitlab_file_path: uploadResult.gitlabFilePath,
      gitlab_url: uploadResult.gitlabUrl,
      file_name: uploadResult.fileName,
      file_path: uploadResult.gitlabFilePath, // Use GitLab path as file_path for legacy compatibility
      file_size: uploadResult.fileSize,
      mime_type: uploadResult.mimeType,
      uploaded_by: req.user.id
    });

    // Image uploaded successfully

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: {
          id: imageRecord.id,
          image_type: imageRecord.image_type,
          file_name: imageRecord.file_name,
          file_size: imageRecord.file_size,
          mime_type: imageRecord.mime_type,
          uploaded_at: imageRecord.uploaded_at
        }
      }
    });

  } catch (error) {
    console.error('Image upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

/**
 * Get image by ID (serve image data)
 */
const getImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Image request received

    // PropertyImage model loaded
    
    // Test database connection with a simple query
    try {
      const testQuery = await PropertyImage.findAll({ limit: 1 });
      // Database connection test successful
    } catch (error) {
      console.error('Database connection error:', error.message);
    }
    
    // Get image metadata from database
    const imageRecord = await PropertyImage.findByPk(id);
    // Image record lookup completed
    
    if (!imageRecord) {
      // Image not found in database
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // For public image access, we don't need to check property access
    // Images are publicly accessible via the proxy
    // Fetching image from GitLab

    // Fetch image from GitLab
    console.log(`📥 Fetching image from GitLab: ${imageRecord.gitlab_file_path}`);
    const imageBuffer = await gitlabService.getImage(imageRecord.gitlab_file_path);
    console.log(`✅ Image buffer received: ${imageBuffer.length} bytes`);

    // Set appropriate headers including CORS
    res.set({
      'Content-Type': imageRecord.mime_type,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Disposition': `inline; filename="${imageRecord.file_name}"`,
      'Access-Control-Allow-Origin': config.corsOrigins.join(', '),
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Send image data
    console.log(`📤 Sending image data: ${imageBuffer.length} bytes, Content-Type: ${imageRecord.mime_type}`);
    res.send(imageBuffer);

  } catch (error) {
    console.error('Image fetch error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch image',
      error: error.message
    });
  }
};

/**
 * Get all images for a property
 */
const getPropertyImages = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Property images request received

    // Check if property exists and user has access
    const property = await Property.findOne({ where: { property_id: propertyId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access images from your own surveys'
      });
    }

    // Get all images for the property
    const images = await PropertyImage.findAll({
      where: { property_id: propertyId },
      order: [['uploaded_at', 'DESC']]
    });

    const imageList = images.map(image => ({
      id: image.id,
      image_type: image.image_type,
      file_name: image.file_name,
      file_size: image.file_size,
      mime_type: image.mime_type,
      uploaded_at: image.uploaded_at,
      uploaded_by: image.uploaded_by
    }));

    res.json({
      success: true,
      data: { images: imageList }
    });

  } catch (error) {
    console.error('Property images fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property images',
      error: error.message
    });
  }
};

/**
 * Delete image
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Image deletion request received

    // Get image metadata from database
    const imageRecord = await PropertyImage.findByPk(id);
    
    if (!imageRecord) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check if user has access to this image
    const property = await Property.findOne({ where: { property_id: imageRecord.property_id } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only delete images from your own surveys'
      });
    }

    // Delete from GitLab
    await gitlabService.deleteImage(imageRecord.gitlab_file_path);

    // Delete from database
    await imageRecord.destroy();

    // Image deleted successfully

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Image deletion error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

/**
 * Get image URL (for frontend to construct image URLs)
 */
const getImageUrl = async (req, res) => {
  try {
    const { id } = req.params;

    // Get image metadata from database
    const imageRecord = await PropertyImage.findByPk(id);
    
    if (!imageRecord) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check if user has access to this image
    const property = await Property.findOne({ where: { property_id: imageRecord.property_id } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access images from your own surveys'
      });
    }

    // Return the image URL
    res.json({
      success: true,
      data: {
        image_url: `${config.apiBaseUrl}/api/images/${imageRecord.id}`,
        file_name: imageRecord.file_name,
        mime_type: imageRecord.mime_type
      }
    });

  } catch (error) {
    console.error('Image URL fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get image URL',
      error: error.message
    });
  }
};

// Temporary image functions removed - no longer needed with direct property_id approach

module.exports = {
  uploadImage,
  getImage,
  getPropertyImages,
  deleteImage,
  getImageUrl
};
