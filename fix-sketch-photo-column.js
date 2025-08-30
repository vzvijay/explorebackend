#!/usr/bin/env node

/**
 * Database Migration Script: Fix sketch_photo column type
 * Changes sketch_photo from VARCHAR(255) to TEXT to support Base64 image data
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function fixSketchPhotoColumn() {
  console.log('🔧 Starting database migration: Fix sketch_photo column type...');
  
  let sequelize;
  
  try {
    // Connect to database
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      });
    } else {
      console.log('❌ DATABASE_URL not found. Please check your environment variables.');
      process.exit(1);
    }
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Check current column type
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'sketch_photo'
    `);
    
    if (results.length === 0) {
      console.log('❌ sketch_photo column not found in properties table.');
      process.exit(1);
    }
    
    const currentType = results[0];
    console.log(`📊 Current sketch_photo column: ${currentType.data_type}(${currentType.character_maximum_length || 'unlimited'})`);
    
    // Check if migration is needed
    if (currentType.data_type === 'text' || currentType.character_maximum_length === null) {
      console.log('✅ sketch_photo column is already TEXT type. No migration needed.');
      process.exit(0);
    }
    
    // Run the migration
    console.log('🔄 Running migration: ALTER TABLE properties ALTER COLUMN sketch_photo TYPE TEXT...');
    
    await sequelize.query(`
      ALTER TABLE properties 
      ALTER COLUMN sketch_photo TYPE TEXT
    `);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'sketch_photo'
    `);
    
    const newType = verifyResults[0];
    console.log(`📊 New sketch_photo column: ${newType.data_type}(${newType.character_maximum_length || 'unlimited'})`);
    
    if (newType.data_type === 'text') {
      console.log('🎉 Migration verified successfully! sketch_photo column is now TEXT type.');
    } else {
      console.log('❌ Migration verification failed. Column type not updated.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the migration
fixSketchPhotoColumn().catch(console.error);
