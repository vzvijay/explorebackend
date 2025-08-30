const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/imageOptimization');

/**
 * Optimize sketch photo with configurable quality settings
 * @param {Buffer} inputBuffer - Raw image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
const optimizeSketchPhoto = async (inputBuffer, options = {}) => {
  try {
    // Merge options with configuration
    const optimizationOptions = {
      quality: options.quality || config.sketchPhoto.quality,
      maxWidth: options.maxWidth || config.sketchPhoto.maxWidth,
      maxHeight: options.maxHeight || config.sketchPhoto.maxHeight,
      format: options.format || config.sketchPhoto.format,
      progressive: options.progressive !== undefined ? options.progressive : config.sketchPhoto.progressive,
      removeMetadata: options.removeMetadata !== undefined ? options.removeMetadata : config.sketchPhoto.removeMetadata,
      stripColorProfile: options.stripColorProfile !== undefined ? options.stripColorProfile : config.sketchPhoto.stripColorProfile
    };

    console.log(`Optimizing sketch photo with quality: ${optimizationOptions.quality}, max dimensions: ${optimizationOptions.maxWidth}x${optimizationOptions.maxHeight}`);

    // Start with Sharp processing
    let sharpInstance = sharp(inputBuffer);

    // Resize if needed (maintain aspect ratio)
    if (optimizationOptions.maxWidth || optimizationOptions.maxHeight) {
      sharpInstance = sharpInstance.resize(
        optimizationOptions.maxWidth || null,
        optimizationOptions.maxHeight || null,
        { 
          fit: 'inside', 
          withoutEnlargement: true 
        }
      );
    }

    // Remove metadata if configured
    if (optimizationOptions.removeMetadata) {
      sharpInstance = sharpInstance.withMetadata(false);
    }

    // Strip color profile if configured
    if (optimizationOptions.stripColorProfile) {
      sharpInstance = sharpInstance.removeAlpha();
    }

    // Apply format-specific optimizations
    if (optimizationOptions.format === 'jpeg' || optimizationOptions.format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ 
        quality: Math.round(optimizationOptions.quality * 100),
        progressive: optimizationOptions.progressive
      });
    } else if (optimizationOptions.format === 'png') {
      sharpInstance = sharpInstance.png({ 
        quality: Math.round(optimizationOptions.quality * 100),
        progressive: optimizationOptions.progressive
      });
    } else if (optimizationOptions.format === 'webp') {
      sharpInstance = sharpInstance.webp({ 
        quality: Math.round(optimizationOptions.quality * 100)
      });
    }

    // Process and return optimized buffer
    const optimizedBuffer = await sharpInstance.toBuffer();
    
    const originalSize = inputBuffer.length;
    const optimizedSize = optimizedBuffer.length;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Sketch photo optimization complete: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`);
    
    return optimizedBuffer;
  } catch (error) {
    console.error('Error optimizing sketch photo:', error);
    throw new Error(`Failed to optimize sketch photo: ${error.message}`);
  }
};

/**
 * Generate filename for sketch photo
 * @param {string} propertyId - Property UUID
 * @param {string} originalExtension - Original file extension
 * @returns {string} - Generated filename
 */
const generateSketchPhotoFilename = (propertyId, originalExtension) => {
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  const prefix = config.naming.prefix;
  const extension = config.sketchPhoto.format === 'jpeg' ? 'jpg' : config.sketchPhoto.format;
  
  return `${prefix}_${propertyId}_${timestamp}.${extension}`;
};

/**
 * Ensure sketch photo directory exists
 * @returns {Promise<void>}
 */
const ensureSketchPhotoDirectory = async () => {
  try {
    const sketchPhotoDir = path.join(process.cwd(), config.storage.sketchPhotoDir);
    await fs.mkdir(sketchPhotoDir, { recursive: true });
    console.log(`Sketch photo directory ensured: ${sketchPhotoDir}`);
  } catch (error) {
    console.error('Error creating sketch photo directory:', error);
    throw new Error(`Failed to create sketch photo directory: ${error.message}`);
  }
};

/**
 * Save optimized sketch photo to file system
 * @param {Buffer} optimizedBuffer - Optimized image buffer
 * @param {string} filename - Filename to save as
 * @returns {Promise<string>} - File path where photo was saved
 */
const saveSketchPhoto = async (optimizedBuffer, filename) => {
  try {
    await ensureSketchPhotoDirectory();
    
    const filePath = path.join(process.cwd(), config.storage.sketchPhotoDir, filename);
    await fs.writeFile(filePath, optimizedBuffer);
    
    console.log(`Sketch photo saved: ${filePath}`);
    return path.join(config.storage.sketchPhotoDir, filename); // Return relative path for database
  } catch (error) {
    console.error('Error saving sketch photo:', error);
    throw new Error(`Failed to save sketch photo: ${error.message}`);
  }
};

/**
 * Validate file type for sketch photo
 * @param {string} mimetype - File MIME type
 * @returns {boolean} - Whether file type is allowed
 */
const validateSketchPhotoType = (mimetype) => {
  return config.storage.allowedTypes.includes(mimetype);
};

/**
 * Validate file size for sketch photo
 * @param {number} fileSize - File size in bytes
 * @returns {boolean} - Whether file size is allowed
 */
const validateSketchPhotoSize = (fileSize) => {
  return fileSize <= config.storage.maxFileSize;
};

module.exports = {
  optimizeSketchPhoto,
  generateSketchPhotoFilename,
  ensureSketchPhotoDirectory,
  saveSketchPhoto,
  validateSketchPhotoType,
  validateSketchPhotoSize
};
