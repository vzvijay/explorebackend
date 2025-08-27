const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Database connection
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

async function createNewAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // New admin user details
    const newAdmin = {
      employee_id: 'MH2024ADM004',
      first_name: 'Gajanan',
      last_name: 'Tayde',
      email: 'gajanan@gmail.com',
      phone: '+91-9876543210',
      password: 'gajanan@123',
      role: 'admin',
      department: 'Survey Department',
      assigned_area: 'All Areas',
      is_active: true
    };
    
    console.log('🔧 Creating new admin user...');
    console.log('Email:', newAdmin.email);
    console.log('Password:', newAdmin.password);
    console.log('Role:', newAdmin.role);
    
    // Generate password hash
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newAdmin.password, saltRounds);
    console.log('✅ Password hash generated');
    console.log('Hash length:', passwordHash.length);
    console.log('Hash starts with:', passwordHash.substring(0, 20) + '...');
    
    // Test the hash
    const isValid = await bcrypt.compare(newAdmin.password, passwordHash);
    console.log('🧪 Hash test result:', isValid);
    
    if (isValid) {
      // Insert new user
      const [result] = await sequelize.query(`
        INSERT INTO users (
          employee_id, first_name, last_name, email, phone, 
          password, role, department, assigned_area, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, role
      `, [
        newAdmin.employee_id,
        newAdmin.first_name,
        newAdmin.last_name,
        newAdmin.email,
        newAdmin.phone,
        passwordHash,
        newAdmin.role,
        newAdmin.department,
        newAdmin.assigned_area,
        newAdmin.is_active
      ]);
      
      if (result.length > 0) {
        console.log('✅ New admin user created successfully!');
        console.log('User ID:', result[0].id);
        console.log('Email:', result[0].email);
        console.log('Role:', result[0].role);
        
        console.log('\n🎉 LOGIN CREDENTIALS:');
        console.log('Email:', newAdmin.email);
        console.log('Password:', newAdmin.password);
        console.log('Role:', newAdmin.role);
        
      } else {
        console.log('⚠️ User already exists or creation failed');
      }
    } else {
      console.log('❌ Hash generation failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createNewAdmin();
