const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');

const router = express.Router();

// Login validation rules
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email or username is required')
    .custom((value) => {
      // Accept both email format and username format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9._-]+$/;
      
      if (emailRegex.test(value) || usernameRegex.test(value)) {
        return true;
      }
      
      throw new Error('Please provide a valid email or username format');
    })
    .normalizeEmail()
    .withMessage('Please provide a valid email or username'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Profile update validation rules
const profileUpdateValidation = [
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number')
];

// Password change validation rules
const passwordChangeValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase and number')
];

// Routes
router.post('/login', loginValidation, login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, profileUpdateValidation, updateProfile);
router.put('/change-password', authenticateToken, passwordChangeValidation, changePassword);

// Test route to verify file loading
router.get('/test-route', (req, res) => {
  res.json({ message: 'Auth routes file is loaded correctly', timestamp: new Date().toISOString() });
});

// Temporary password reset endpoint (remove after testing) - V2
router.post('/reset-gajanan-password', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { User } = require('../models');
    
    const password = 'gajanan@123';
    const saltRounds = 12;
    
    // Generate new hash
    const newHash = await bcrypt.hash(password, saltRounds);
    
    // Update user password
    const user = await User.findOne({ where: { email: 'gajanan.tayde' } });
    if (user) {
      await user.update({ password: newHash });
      
      // Test the new hash
      const isValid = await bcrypt.compare(password, newHash);
      
      res.json({
        success: true,
        message: 'Password reset successful',
        hashTest: isValid,
        newHash: newHash.substring(0, 20) + '...'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

module.exports = router; 