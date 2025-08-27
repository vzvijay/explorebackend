const express = require('express');
const router = express.Router();

// Debug route to check environment variables
router.get('/debug-env', (req, res) => {
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 
      `SET (length: ${process.env.JWT_SECRET.length}, starts with: ${process.env.JWT_SECRET.substring(0, 10)}...)` : 
      'NOT SET',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 
      `SET (starts with: ${process.env.DATABASE_URL.substring(0, 30)}...)` : 
      'NOT SET',
    PORT: process.env.PORT || 'NOT SET',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    message: 'Environment Variables Check',
    environment: envInfo,
    note: 'If JWT_SECRET is NOT SET, login will always fail with 401'
  });
});

// Test database connection
router.get('/debug-db', async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    
    if (!process.env.DATABASE_URL) {
      return res.json({
        error: 'DATABASE_URL not set',
        message: 'Cannot test database connection'
      });
    }
    
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    await sequelize.authenticate();
    
    // Check users table
    const [users] = await sequelize.query(`
      SELECT email, role, password 
      FROM users 
      WHERE email = 'gajanan.tayde'
    `);
    
    await sequelize.close();
    
    res.json({
      message: 'Database connection successful',
      gajananUser: users.length > 0 ? {
        email: users[0].email,
        role: users[0].role,
        passwordHashLength: users[0].password.length,
        passwordHashStart: users[0].password.substring(0, 20) + '...'
      } : 'User not found'
    });
    
  } catch (error) {
    res.json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

module.exports = router;
