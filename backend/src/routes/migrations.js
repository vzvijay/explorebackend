const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const sequelize = require('../database/config');

const router = express.Router();

// Run sketch_photo column migration
router.post('/fix-sketch-photo-column', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('🔧 Starting sketch_photo column migration...');
    
    // Check current column type
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'sketch_photo'
    `);
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sketch_photo column not found in properties table'
      });
    }
    
    const currentType = results[0];
    console.log(`📊 Current sketch_photo column: ${currentType.data_type}(${currentType.character_maximum_length || 'unlimited'})`);
    
    // Check if migration is needed
    if (currentType.data_type === 'text' || currentType.character_maximum_length === null) {
      return res.json({
        success: true,
        message: 'sketch_photo column is already TEXT type. No migration needed.',
        currentType: currentType.data_type
      });
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
      res.json({
        success: true,
        message: 'Migration completed successfully! sketch_photo column is now TEXT type.',
        previousType: currentType.data_type,
        newType: newType.data_type
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Migration verification failed. Column type not updated.',
        currentType: newType.data_type
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

module.exports = router;
