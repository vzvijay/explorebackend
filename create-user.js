#!/usr/bin/env node

// Script to create the first user account
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database connection - use environment variables directly
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgresql://explorebackend_db_user:DecXbUcWT0XI3CgYDct8dkimZpis66gN@dpg-d2mkvpogjchc73cp1o6g-a.singapore-postgres.render.com/explorebackend_db', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// User model definition
const User = sequelize.define('User', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  employee_id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  first_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  last_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('admin', 'municipal_officer', 'engineer', 'field_executive'),
    allowNull: false
  },
  department: {
    type: Sequelize.STRING
  },
  assigned_area: {
    type: Sequelize.STRING
  },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

async function createUser() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const user = await User.create({
      employee_id: 'ADMIN001',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@explore.com',
      phone: '+91-9876543210',
      password: hashedPassword,
      role: 'admin',
      department: 'Administration',
      assigned_area: 'All Areas'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📋 Login Credentials:');
    console.log('   Email: admin@explore.com');
    console.log('   Password: admin123');
    console.log('   Role: Admin');
    console.log('   Employee ID: ADMIN001');

    await sequelize.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('⚠️ User already exists with this email or employee ID');
    }
  }
}

createUser();
