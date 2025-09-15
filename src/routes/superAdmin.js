const express = require('express');
const router = express.Router();
const { superAdminAuth } = require('../middleware/superAdminAuth');
const { authenticateToken } = require('../middleware/auth');
const { 
  hardDeleteProperty, 
  getDeletableProperties 
} = require('../controllers/superAdminController');

/**
 * Super Admin Routes
 * 
 * These routes handle hard delete operations for super admin users
 * 
 * PRODUCTION ENABLED - Super admin functionality for production use
 */

// Apply authentication middleware to all super admin routes
router.use(authenticateToken);

// Apply super admin role middleware to all super admin routes
router.use(superAdminAuth);

// GET /api/super-admin/properties - Get properties that can be hard deleted
router.get('/properties', getDeletableProperties);

// DELETE /api/super-admin/property/:propertyId - Hard delete a property
router.delete('/property/:propertyId', hardDeleteProperty);

module.exports = router;
