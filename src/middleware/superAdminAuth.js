/**
 * Super Admin Authentication Middleware
 * 
 * This middleware ensures only super_admin role users can access super admin endpoints
 * 
 * PRODUCTION ENABLED - Super admin functionality for production use
 */

const { User } = require('../models');

/**
 * Middleware to verify super admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const superAdminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has super_admin role
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required',
        userRole: req.user.role
      });
    }

    // Verify user still exists and has super_admin role in database
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin role required',
        userRole: user.role
      });
    }

    // Add super admin flag to request
    req.superAdmin = true;
    req.superAdminUser = user;

    console.log(`🔐 Super admin access granted to: ${user.email} (${user.id})`);

    next();

  } catch (error) {
    console.error('❌ Error in super admin authentication:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = {
  superAdminAuth
};
