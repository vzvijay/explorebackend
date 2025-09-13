// Image Optimization Configuration
// This file contains configurable settings for image processing
// All values can be overridden via environment variables

module.exports = {
  sketchPhoto: {
    // Quality setting for sketch photo optimization (0.1 to 1.0)
    // 0.7 = 70% quality - optimal balance of quality vs. file size
    quality: parseFloat(process.env.SKETCH_PHOTO_QUALITY) || 0.7,
    
    // Maximum dimensions for sketch photos
    maxWidth: parseInt(process.env.SKETCH_PHOTO_MAX_WIDTH) || 1920,
    maxHeight: parseInt(process.env.SKETCH_PHOTO_MAX_HEIGHT) || 1080,
    
    // Output format for sketch photos
    format: process.env.SKETCH_PHOTO_FORMAT || 'jpeg',
    
    // Progressive JPEG for better loading
    progressive: process.env.SKETCH_PHOTO_PROGRESSIVE !== 'false',
    
    // Remove metadata for privacy and smaller file size
    removeMetadata: process.env.SKETCH_PHOTO_REMOVE_METADATA !== 'false',
    
    // Strip color profiles for consistency
    stripColorProfile: process.env.SKETCH_PHOTO_STRIP_COLOR_PROFILE !== 'false'
  },
  
  // File storage settings
  storage: {
    // Directory for storing sketch photos
    sketchPhotoDir: process.env.SKETCH_PHOTO_DIR || 'uploads/sketches',
    
    // Maximum file size before optimization (in bytes)
    maxFileSize: parseInt(process.env.SKETCH_PHOTO_MAX_FILE_SIZE) || 20 * 1024 * 1024, // 20MB
    
    // Allowed file types for sketch photos
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // Naming convention for sketch photo files
  naming: {
    prefix: process.env.SKETCH_PHOTO_PREFIX || 'drawing',
    includeTimestamp: process.env.SKETCH_PHOTO_INCLUDE_TIMESTAMP !== 'false',
    timestampFormat: process.env.SKETCH_PHOTO_TIMESTAMP_FORMAT || 'YYYYMMDD_HHMMSS'
  }
};
