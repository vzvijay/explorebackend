const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const {
  getPendingApprovals,
  approveProperty,
  rejectProperty,
  getApprovalStats,
  getPropertyForApproval
} = require('../controllers/adminController');

/**
 * Admin Routes
 * All routes require admin authentication
 */

// Apply admin middleware to all routes
router.use(requireAdmin);

// GET /api/admin/pending-approvals - Get list of pending approvals
router.get('/pending-approvals', getPendingApprovals);

// GET /api/admin/approval-stats - Get approval statistics
router.get('/approval-stats', getApprovalStats);

// GET /api/admin/property/:propertyId - Get property details for approval review
router.get('/property/:propertyId', getPropertyForApproval);

// POST /api/admin/approve/:propertyId - Approve a property survey
router.post('/approve/:propertyId', approveProperty);

// POST /api/admin/reject/:propertyId - Reject a property survey
router.post('/reject/:propertyId', rejectProperty);

module.exports = router;
