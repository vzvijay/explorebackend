#!/usr/bin/env node

/**
 * Direct Database Migration Script for Render PostgreSQL
 * Fixes sketch_photo column from VARCHAR(255) to TEXT
 */

const { Client } = require('pg');

// Render PostgreSQL connection details
const connectionConfig = {
  host: 'dpg-d2mkvpogjchc73cp1o6g-a.oregon-postgres.render.com',
  port: 5432,
  database: 'explorebackend_db',
  user: 'explorebackend_db_user',
  password: 'DecXbUcWT0XI3CgYDct8dkimZpis66gN',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runMigration() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('🔧 Connecting to Render PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    // Check current column type
    console.log('📊 Checking current sketch_photo column type...');
    const checkQuery = `
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'sketch_photo'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ sketch_photo column not found in properties table');
      return;
    }
    
    const currentType = checkResult.rows[0];
    console.log(`📊 Current sketch_photo column: ${currentType.data_type}(${currentType.character_maximum_length || 'unlimited'})`);
    
    // Check if migration is needed
    if (currentType.data_type === 'text' || currentType.character_maximum_length === null) {
      console.log('✅ sketch_photo column is already TEXT type. No migration needed.');
      return;
    }
    
    // Run the migration
    console.log('🔄 Running migration: ALTER TABLE properties ALTER COLUMN sketch_photo TYPE TEXT...');
    
    const migrationQuery = `
      ALTER TABLE properties 
      ALTER COLUMN sketch_photo TYPE TEXT
    `;
    
    await client.query(migrationQuery);
    console.log('✅ Migration completed successfully!');
    
    // Verify the change
    console.log('🔍 Verifying the migration...');
    const verifyResult = await client.query(checkQuery);
    const newType = verifyResult.rows[0];
    
    console.log(`📊 New sketch_photo column: ${newType.data_type}(${newType.character_maximum_length || 'unlimited'})`);
    
    if (newType.data_type === 'text') {
      console.log('🎉 Migration verified successfully! sketch_photo column is now TEXT type.');
      console.log('🚀 Your form submission should now work perfectly!');
    } else {
      console.log('❌ Migration verification failed. Column type not updated.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

// Run the migration
console.log('🚀 Starting sketch_photo column migration on Render PostgreSQL...');
runMigration().catch(console.error);
