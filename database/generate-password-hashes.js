// Generate Password Hashes for Admin Users
// Run this script to generate bcrypt hashes for passwords

const bcrypt = require('bcrypt');

async function generateHashes() {
  try {
    // Generate hash for gajana@maharashtra.gov.in
    const gajanaPassword = 'gajanan123';
    const gajanaHash = await bcrypt.hash(gajanaPassword, 10);
    
    // Generate hash for vilas@@maharashtra.gov.in
    const vilasPassword = 'vilas123';
    const vilasHash = await bcrypt.hash(vilasPassword, 10);
    
    console.log('🔐 Password Hashes Generated:');
    console.log('');
    console.log('gajana@maharashtra.gov.in:');
    console.log(`Password: ${gajanaPassword}`);
    console.log(`Hash: ${gajanaHash}`);
    console.log('');
    console.log('vilas@@maharashtra.gov.in:');
    console.log(`Password: ${vilasPassword}`);
    console.log(`Hash: ${vilasHash}`);
    console.log('');
    console.log('📝 Use these hashes in your SQL INSERT statements');
    
  } catch (error) {
    console.error('❌ Error generating hashes:', error);
  }
}

generateHashes();
