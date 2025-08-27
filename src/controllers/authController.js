const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Login user
const login = async (req, res) => {
  try {
    console.log('🔍 Login attempt - Request body:', req.body);
    console.log('🔍 Login attempt - Headers:', req.headers);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('🔍 Login attempt - Email/Username:', email);
    console.log('🔍 Login attempt - Password length:', password ? password.length : 0);

    // Find user by email
    const user = await User.findOne({ 
      where: { email, is_active: true } 
    });

    console.log('🔍 User lookup result:', user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    } : 'User not found');

    if (!user) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    console.log('🔍 Attempting password comparison...');
    const isValidPassword = await user.comparePassword(password);
    console.log('🔍 Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified successfully');

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(user.id);
    console.log('🔍 JWT token generated, length:', token.length);

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.assigned_area
    };

    console.log('✅ Login successful for user:', user.email);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          employee_id: user.employee_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          assigned_area: user.assigned_area,
          last_login: user.last_login
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { first_name, last_name, phone } = req.body;
    const user = req.user;

    await user.update({
      first_name,
      last_name,
      phone
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          employee_id: user.employee_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          assigned_area: user.assigned_area
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { current_password, new_password } = req.body;
    const user = req.user;

    // Verify current password
    const isValidPassword = await user.comparePassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: new_password });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword
}; 