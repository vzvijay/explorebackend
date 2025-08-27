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

async function fixPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    const password = 'gajanan@123';
    const saltRounds = 12;
    
    // Generate new hash
    console.log('🔧 Generating new password hash...');
    const newHash = await bcrypt.hash(password, saltRounds);
    console.log('New hash generated:', newHash);
    console.log('Hash length:', newHash.length);
    console.log('Hash starts with:', newHash.substring(0, 10) + '...');
    
    // Test the hash
    console.log('\n🧪 Testing new hash...');
    const isValid = await bcrypt.compare(password, newHash);
    console.log('Password comparison test:', isValid);
    
    if (isValid) {
      // Update the database
      console.log('\n💾 Updating database...');
      const [result] = await sequelize.query(`
        UPDATE users 
        SET password = $1 
        WHERE email = 'gajanan.tayde'
      `, [newHash]);
      
      console.log('Database update result:', result);
      console.log('✅ Password hash updated successfully!');
      
      // Verify the update
      console.log('\n🔍 Verifying update...');
      const [users] = await sequelize.query(`
        SELECT email, password 
        FROM users 
        WHERE email = 'gajanan.tayde'
      `);
      
      if (users.length > 0) {
        const user = users[0];
        console.log('Updated hash:', user.password);
        console.log('Updated hash length:', user.password.length);
        
        // Test the updated hash
        const finalTest = await bcrypt.compare(password, user.password);
        console.log('Final password test:', finalTest);
        
        if (finalTest) {
          console.log('🎉 SUCCESS: Password hash is now working correctly!');
        } else {
          console.log('❌ ERROR: Password hash still not working after update');
        }
      }
    } else {
      console.log('❌ ERROR: Generated hash is not working');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixPassword();
