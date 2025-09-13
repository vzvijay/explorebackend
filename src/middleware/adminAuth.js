const { authenticateToken } = require('./auth');

/**
 * Admin Authentication Middleware
 * Ensures user is authenticated and has admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the token using the middleware pattern
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Check if user has admin role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has admin role
    const allowedRoles = ['admin', 'municipal_officer', 'engineer'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        requiredRole: 'admin, municipal_officer, or engineer',
        userRole: req.user.role
      });
    }

    // User is authenticated and has admin role
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Super Admin Middleware (Optional - for sensitive operations)
 * Ensures user has super admin role
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    // First authenticate the token using the middleware pattern
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Check if user has super admin role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only super admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.',
        requiredRole: 'admin',
        userRole: req.user.role
      });
    }

    // User is authenticated and has super admin role
    next();
  } catch (error) {
    console.error('Super admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = {
  requireAdmin,
  requireSuperAdmin
};
