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

async function debugPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get the user and password hash
    const [users] = await sequelize.query(`
      SELECT id, email, password, role 
      FROM users 
      WHERE email = 'gajanan.tayde'
    `);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    console.log('\n=== USER DETAILS ===');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password Hash:', user.password);
    console.log('Hash Length:', user.password.length);
    console.log('Hash Starts With:', user.password.substring(0, 10) + '...');
    
    // Test password comparison
    const testPassword = 'gajanan@123';
    console.log('\n=== PASSWORD TEST ===');
    console.log('Test Password:', testPassword);
    console.log('Password Length:', testPassword.length);
    
    // Test with bcryptjs
    console.log('\n--- Testing with bcryptjs ---');
    const bcryptjsResult = await bcrypt.compare(testPassword, user.password);
    console.log('bcryptjs.compare result:', bcryptjsResult);
    
    // Test with bcrypt (if available)
    try {
      const bcryptLib = require('bcrypt');
      console.log('\n--- Testing with bcrypt ---');
      const bcryptResult = await bcryptLib.compare(testPassword, user.password);
      console.log('bcrypt.compare result:', bcryptResult);
    } catch (error) {
      console.log('bcrypt library not available');
    }
    
    // Check if password hash format is correct
    console.log('\n=== HASH FORMAT ANALYSIS ===');
    const hashParts = user.password.split('$');
    console.log('Hash parts:', hashParts);
    if (hashParts.length >= 3) {
      console.log('Algorithm:', hashParts[1]);
      console.log('Cost factor:', hashParts[2]);
      console.log('Salt + Hash:', hashParts[3]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugPassword();
