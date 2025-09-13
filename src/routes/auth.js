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



module.exports = router; 