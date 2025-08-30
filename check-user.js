const { Sequelize, DataTypes } = require('sequelize');

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

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);
    
    if (results.length === 0) {
      console.log('❌ Users table does not exist');
      return;
    }
    
    console.log('✅ Users table exists');
    
    // Check all users
    const [users] = await sequelize.query(`
      SELECT id, email, password, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== ALL USERS IN DATABASE ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`   Hash Length: ${user.password.length}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // Check specific user
    const [gajananUser] = await sequelize.query(`
      SELECT * FROM users WHERE email = 'gajanan.tayde'
    `);
    
    if (gajananUser.length > 0) {
      console.log('✅ gajanan.tayde user found');
      const user = gajananUser[0];
      console.log('Password Hash:', user.password);
      console.log('Hash Length:', user.password.length);
      console.log('Role:', user.role);
    } else {
      console.log('❌ gajanan.tayde user NOT found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUser();
