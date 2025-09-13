const express = require('express');
const multer = require('multer');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  uploadImage,
  getImage,
  getPropertyImages,
  deleteImage,
  getImageUrl
} = require('../controllers/imageController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware to handle multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }
  
  next(error);
};

// Routes

/**
 * Upload image
 * POST /api/images/upload
 * Body: multipart/form-data with file, propertyId, imageType
 */
router.post('/upload',
  authenticateToken,
  authorizeRoles('field_executive', 'municipal_officer', 'engineer', 'admin'),
  upload.single('image'),
  handleMulterError,
  uploadImage
);

/**
 * Get image by ID (serve image data)
 * GET /api/images/:id
 * Note: No authentication required for public image access
 */
router.get('/:id',
  getImage
);

/**
 * Get image URL
 * GET /api/images/:id/url
 */
router.get('/:id/url',
  authenticateToken,
  getImageUrl
);

/**
 * Get all images for a property
 * GET /api/images/property/:propertyId
 */
router.get('/property/:propertyId',
  authenticateToken,
  getPropertyImages
);

/**
 * Delete image
 * DELETE /api/images/:id
 */
router.delete('/:id',
  authenticateToken,
  authorizeRoles('field_executive', 'municipal_officer', 'engineer', 'admin'),
  deleteImage
);

module.exports = router;
