#!/usr/bin/env node

// Simple test script to verify database connection
require('dotenv').config({ path: './env.local' });

console.log('🔍 Testing local configuration...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);

// Test database connection
const { Sequelize } = require('sequelize');

async function testDatabase() {
  try {
    console.log('\n🔌 Testing database connection...');
    
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

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Database query successful:', result[0][0]);
    
    await sequelize.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testDatabase();
