const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Role-based authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient privileges' 
      });
    }

    next();
  };
};

// Check if user can access property (field executives can only access their own)
const checkPropertyAccess = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const propertyId = req.params.id || req.body.property_id;

    // Admin, municipal officers, and engineers have access to all properties
    if (['admin', 'municipal_officer', 'engineer'].includes(role)) {
      return next();
    }

    // Field executives can only access properties they surveyed
    if (role === 'field_executive') {
      const { Property } = require('../models');
      const property = await Property.findOne({ where: { property_id: propertyId } });
      
      if (!property) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
      }

      if (property.surveyed_by !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: You can only access properties you surveyed' 
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking property access' 
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkPropertyAccess
}; 