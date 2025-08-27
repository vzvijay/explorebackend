// Check current environment variables
console.log('=== CURRENT ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (starts with: ' + process.env.DATABASE_URL.substring(0, 20) + '...)' : 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');

// Check JWT_SECRET format
if (process.env.JWT_SECRET) {
  console.log('\n=== JWT_SECRET ANALYSIS ===');
  console.log('Length:', process.env.JWT_SECRET.length);
  console.log('Starts with:', process.env.JWT_SECRET.substring(0, 10) + '...');
  console.log('Contains only hex chars:', /^[a-f0-9]+$/i.test(process.env.JWT_SECRET));
}

console.log('\n=== DATABASE_URL ANALYSIS ===');
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  console.log('Protocol:', dbUrl.split('://')[0]);
  console.log('Username:', dbUrl.split('://')[1]?.split(':')[0]);
  console.log('Host:', dbUrl.split('@')[1]?.split('/')[0]);
  console.log('Database:', dbUrl.split('/').pop());
}
