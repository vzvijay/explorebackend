const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const {
  getPendingApprovals,
  approveProperty,
  rejectProperty,
  getApprovalStats,
  getPropertyForApproval,
  deleteProperty
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

// DELETE /api/admin/property/:propertyId - Soft delete a property (Admin only)
router.delete('/property/:propertyId', deleteProperty);

// TEMPORARY: Update user role to super_admin (for fixing production issue)
router.post('/update-super-admin-role', async (req, res) => {
  try {
    const { User } = require('../models');
    
    const user = await User.findOne({ where: { email: 'vijay@superadmin.com' } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Current user role:', user.role);
    
    if (user.role === 'super_admin') {
      return res.json({
        success: true,
        message: 'User already has super_admin role',
        data: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    }

    await user.update({ role: 'super_admin' });
    
    res.json({
      success: true,
      message: 'User role updated to super_admin',
      data: {
        id: user.id,
        email: user.email,
        role: 'super_admin'
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
});

module.exports = router;
