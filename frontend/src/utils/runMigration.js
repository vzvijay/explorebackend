/**
 * Utility to run database migration for fixing sketch_photo column type
 * This script can be run from the browser console to trigger the migration
 */

import { apiClient } from '../services/apiClient';

export const runSketchPhotoMigration = async () => {
  try {
    console.log('🔧 Triggering sketch_photo column migration...');
    
    const response = await apiClient.post('/api/migrations/fix-sketch-photo-column');
    
    if (response.data.success) {
      console.log('✅ Migration completed successfully!');
      console.log('📊 Details:', response.data);
      return response.data;
    } else {
      console.error('❌ Migration failed:', response.data);
      return response.data;
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Function to run migration from browser console
export const runMigrationFromConsole = () => {
  console.log('🚀 Running sketch_photo column migration...');
  console.log('📝 This will fix the database column type to support Base64 images');
  
  runSketchPhotoMigration()
    .then(result => {
      console.log('🎉 Migration result:', result);
      alert(`Migration completed: ${result.message}`);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      alert(`Migration failed: ${error.message}`);
    });
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.runSketchPhotoMigration = runMigrationFromConsole;
  console.log('🔧 Migration utility loaded. Run: runSketchPhotoMigration() in console');
}
