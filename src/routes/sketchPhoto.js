const express = require('express');
const multer = require('multer');
const { authenticateToken: auth } = require('../middleware/auth');
const Property = require('../models/Property');
const { 
  optimizeSketchPhoto, 
  generateSketchPhotoFilename, 
  saveSketchPhoto,
  validateSketchPhotoType,
  validateSketchPhotoSize
} = require('../utils/imageOptimizer');

const router = express.Router();

// Test route to check if router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Sketch photo router is working' });
});

// Simple test route without complex middleware
router.get('/simple', (req, res) => {
  res.json({ message: 'Simple route working' });
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!validateSketchPhotoType(file.mimetype)) {
      return cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
    cb(null, true);
  }
});

// Test route with just auth middleware
router.get('/auth-test', auth, (req, res) => {
  res.json({ message: 'Auth middleware working', user: req.user.email });
});

// Test route with just multer middleware
router.post('/multer-test', upload.single('test_file'), (req, res) => {
  res.json({ message: 'Multer middleware working', file: req.file ? 'File received' : 'No file' });
});

// POST /api/sketch-photo/:propertyId - Upload sketch photo (File-based - Legacy)
router.post('/:propertyId', auth, upload.single('sketch_photo'), async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { file } = req;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No sketch photo file provided'
      });
    }

    if (!validateSketchPhotoSize(file.size)) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum allowed: 20MB`
      });
    }

    const property = await Property.findOne({ where: { property_id: propertyId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only upload sketch photos for your own surveys'
      });
    }

    const filename = generateSketchPhotoFilename(propertyId, file.originalname);
    const optimizedBuffer = await optimizeSketchPhoto(file.buffer);
    const filePath = await saveSketchPhoto(optimizedBuffer, filename);
    
    await property.update({
      sketch_photo: filePath,
      sketch_photo_captured_at: new Date()
    });

    res.json({
      success: true,
      message: 'Sketch photo uploaded successfully',
      data: {
        sketch_photo: filePath,
        sketch_photo_captured_at: property.sketch_photo_captured_at,
        original_size: file.size,
        optimized_size: optimizedBuffer.length,
        compression_ratio: ((file.size - optimizedBuffer.length) / file.size * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('Error uploading sketch photo:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload sketch photo',
      error: error.message
    });
  }
});

// POST /api/sketch-photo/:propertyId/base64 - Save Base64 sketch photo
router.post('/:propertyId/base64', auth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { sketch_photo_base64, sketch_photo_size, sketch_photo_type } = req.body;

    if (!sketch_photo_base64) {
      return res.status(400).json({
        success: false,
        message: 'No sketch photo data provided'
      });
    }

    if (!sketch_photo_size || !sketch_photo_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing photo metadata (size or type)'
      });
    }

    // Validate Base64 data
    if (typeof sketch_photo_base64 !== 'string' || sketch_photo_base64.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sketch photo data format'
      });
    }

    // Check if property exists
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
        message: 'Access denied - you can only upload sketch photos for your own surveys'
      });
    }

    // Update property with Base64 data
    await property.update({
      sketch_photo_base64: sketch_photo_base64,
      sketch_photo_captured_at: new Date()
    });

    res.json({
      success: true,
      message: 'Sketch photo saved successfully',
      data: {
        sketch_photo_base64: sketch_photo_base64,
        sketch_photo_size: sketch_photo_size,
        sketch_photo_type: sketch_photo_type,
        sketch_photo_captured_at: property.sketch_photo_captured_at
      }
    });

  } catch (error) {
    console.error('Error saving Base64 sketch photo:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save sketch photo',
      error: error.message
    });
  }
});

// GET /api/sketch-photo/:propertyId - Get sketch photo info
router.get('/:propertyId', auth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findOne({ where: { property_id: propertyId } });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (!property.sketch_photo) {
      return res.status(404).json({
        success: false,
        message: 'No sketch photo found for this property'
      });
    }

    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only view sketch photos for your own surveys'
      });
    }

    res.json({
      success: true,
      data: {
        sketch_photo: property.sketch_photo,
        sketch_photo_base64: property.sketch_photo_base64,
        sketch_photo_captured_at: property.sketch_photo_captured_at,
        property_id: propertyId
      }
    });

  } catch (error) {
    console.error('Error getting sketch photo:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get sketch photo',
      error: error.message
    });
  }
});

// DELETE /api/sketch-photo/:propertyId - Remove sketch photo
router.delete('/:propertyId', auth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findOne({ where: { property_id: propertyId } });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (!property.sketch_photo) {
      return res.status(404).json({
        success: false,
        message: 'No sketch photo found for this property'
      });
    }

    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only remove sketch photos for your own surveys'
      });
    }

    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const fullPath = path.join(process.cwd(), property.sketch_photo);
      await fs.unlink(fullPath);
      // Sketch photo file removed
    } catch (fileError) {
      console.warn('Warning: Could not remove sketch photo file:', fileError.message);
    }

    await property.update({
      sketch_photo: null,
      sketch_photo_base64: null,
      sketch_photo_captured_at: null
    });

    res.json({
      success: true,
      message: 'Sketch photo removed successfully'
    });

  } catch (error) {
    console.error('Error removing sketch photo:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove sketch photo',
      error: error.message
    });
  }
});

module.exports = router;
