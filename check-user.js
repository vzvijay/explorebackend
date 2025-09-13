const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Connect to the production database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check the field executive user
    const [results] = await sequelize.query(
      "SELECT email, password FROM users WHERE email = 'field1@maharashtra.gov.in'"
    );
    
    if (results.length > 0) {
      const user = results[0];
      console.log('👤 User found:', user.email);
      console.log('🔐 Current password hash:', user.password);
      
      // Test different passwords
      const passwords = ['password123', 'field123', 'admin123'];
      
      for (const password of passwords) {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`🔍 Testing password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      }
      
      // Generate new hash for password123
      const newHash = bcrypt.hashSync('password123', 12);
      console.log('🆕 New hash for password123:', newHash);
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUser();
