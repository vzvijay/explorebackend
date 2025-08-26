#!/usr/bin/env node

// Script to create two field executive user accounts
const bcrypt = require('bcryptjs');

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

async function createFieldExecutives() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Create Field Executive 1
    const hashedPassword1 = await bcrypt.hash('field123', 12);
    
    const user1 = await User.create({
      employee_id: 'MH2024FE001',
      first_name: 'Rahul',
      last_name: 'Jadhav',
      email: 'field1@maharashtra.gov.in',
      phone: '+91-9876543211',
      password: hashedPassword1,
      role: 'field_executive',
      department: 'Survey Department',
      assigned_area: 'Ward 1-5'
    });

    console.log('✅ Field Executive 1 created successfully!');
    console.log('📋 Login Credentials for Field Executive 1:');
    console.log('   Email: field1@maharashtra.gov.in');
    console.log('   Password: field123');
    console.log('   Role: Field Executive');
    console.log('   Employee ID: MH2024FE001');
    console.log('   Assigned Area: Ward 1-5');

    // Create Field Executive 2
    const hashedPassword2 = await bcrypt.hash('field123', 12);
    
    const user2 = await User.create({
      employee_id: 'MH2024FE002',
      first_name: 'Sunita',
      last_name: 'Desai',
      email: 'field2@maharashtra.gov.in',
      phone: '+91-9876543212',
      password: hashedPassword2,
      role: 'field_executive',
      department: 'Survey Department',
      assigned_area: 'Ward 6-10'
    });

    console.log('\n✅ Field Executive 2 created successfully!');
    console.log('📋 Login Credentials for Field Executive 2:');
    console.log('   Email: field2@maharashtra.gov.in');
    console.log('   Password: field123');
    console.log('   Role: Field Executive');
    console.log('   Employee ID: MH2024FE002');
    console.log('   Assigned Area: Ward 6-10');

    await sequelize.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error creating field executives:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('⚠️ User already exists with this email or employee ID');
    }
  }
}

createFieldExecutives();
