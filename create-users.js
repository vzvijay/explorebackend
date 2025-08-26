const bcrypt = require('bcryptjs');
const { User } = require('./src/models');
const sequelize = require('./src/database/config');

async function createUsers() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Hash password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Clear existing users
    await User.destroy({ where: {} });
    console.log('Cleared existing users');

    // Create sample users
    const users = [
      {
        employee_id: 'MH2024ADM001',
        first_name: 'Rajesh',
        last_name: 'Sharma',
        email: 'admin@maharashtra.gov.in',
        phone: '+919876543210',
        password: hashedPassword,
        role: 'admin',
        department: 'IT Department',
        assigned_area: 'All Areas',
        is_active: true
      },
      {
        employee_id: 'MH2024MO001',
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'municipal.officer@maharashtra.gov.in',
        phone: '+919876543211',
        password: hashedPassword,
        role: 'municipal_officer',
        department: 'Revenue Department',
        assigned_area: 'Central District',
        is_active: true
      },
      {
        employee_id: 'MH2024ENG001',
        first_name: 'Amit',
        last_name: 'Kumar',
        email: 'engineer@maharashtra.gov.in',
        phone: '+919876543212',
        password: hashedPassword,
        role: 'engineer',
        department: 'Engineering Department',
        assigned_area: 'Zone A',
        is_active: true
      },
      {
        employee_id: 'MH2024FE001',
        first_name: 'Rahul',
        last_name: 'Jadhav',
        email: 'field1@maharashtra.gov.in',
        phone: '+919876543213',
        password: hashedPassword,
        role: 'field_executive',
        department: 'Survey Department',
        assigned_area: 'Ward 1-5',
        is_active: true
      },
      {
        employee_id: 'MH2024FE002',
        first_name: 'Sunita',
        last_name: 'Desai',
        email: 'field2@maharashtra.gov.in',
        phone: '+919876543214',
        password: hashedPassword,
        role: 'field_executive',
        department: 'Survey Department',
        assigned_area: 'Ward 6-10',
        is_active: true
      }
    ];

    // Create users
    for (const userData of users) {
      const user = await User.create(userData, { hooks: false });
      console.log(`Created user: ${user.first_name} ${user.last_name} (${user.role})`);
    }

    console.log('\n✅ All users created successfully!');
    console.log('\n🔑 Login credentials (password for all users: password123):');
    console.log('👤 Admin: admin@maharashtra.gov.in');
    console.log('👤 Municipal Officer: municipal.officer@maharashtra.gov.in');
    console.log('👤 Engineer: engineer@maharashtra.gov.in');
    console.log('👤 Field Executive 1: field1@maharashtra.gov.in');
    console.log('👤 Field Executive 2: field2@maharashtra.gov.in');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

createUsers(); 