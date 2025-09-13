const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

class GitLabService {
  constructor() {
    this.projectId = process.env.GITLAB_PROJECT_ID || '74298992';
    this.token = process.env.GITLAB_TOKEN;
    this.apiUrl = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';
    this.repoPath = process.env.GITLAB_REPO_PATH || 'images/properties';
    this.branch = process.env.GITLAB_BRANCH || 'main';
    
    // Validate required environment variables
    if (!this.token) {
      throw new Error('GITLAB_TOKEN environment variable is required');
    }
    
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Upload image to GitLab repository
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} fileName - Original file name
   * @param {string} propertyId - Property ID for organization
   * @param {string} imageType - Type of image (owner_photo, signature, sketch_photo)
   * @returns {Promise<Object>} Upload result with GitLab file path and URL
   */
  async uploadImage(fileBuffer, fileName, propertyId, imageType) {
    try {
      // Generate file name with timestamp (no random string needed)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const fileExtension = path.extname(fileName);
      const baseFileName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${imageType}_${timestamp}${fileExtension}`;
      
      // Create year and month for organization (use UTC to avoid timezone issues)
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      
      console.log(`📅 Date debugging:`);
      console.log(`   Current date: ${now.toISOString()}`);
      console.log(`   Local date: ${now.toString()}`);
      console.log(`   Year: ${year}, Month: ${month}`);
      console.log(`   Timezone offset: ${now.getTimezoneOffset()} minutes`);
      
      // Create GitLab file path with property ID folder structure
      const gitlabFilePath = `${this.repoPath}/${year}/${month}/${propertyId}/${uniqueFileName}`;
      
      console.log(`📁 GitLab file path: ${gitlabFilePath}`);
      
      // Encode file path for GitLab API
      const encodedFilePath = encodeURIComponent(gitlabFilePath);
      
      // Prepare file data for GitLab API
      const fileData = {
        branch: this.branch,
        content: fileBuffer.toString('base64'),
        encoding: 'base64',
        commit_message: `Upload ${imageType} for property ${propertyId}`,
        author_email: 'system@surveyapp.com',
        author_name: 'Survey App System'
      };

      console.log(`📤 Uploading ${imageType} to GitLab: ${gitlabFilePath}`);
      
      // Upload to GitLab
      const response = await this.client.post(
        `/projects/${this.projectId}/repository/files/${encodedFilePath}`,
        fileData
      );

      if (response.status === 201) {
        // Generate public URL for the image
        const publicUrl = this.generateImageUrl(gitlabFilePath);
        
        console.log(`✅ Successfully uploaded ${imageType} to GitLab`);
        console.log(`🔗 Public URL: ${publicUrl}`);
        
        return {
          success: true,
          gitlabFilePath: gitlabFilePath,
          gitlabUrl: publicUrl,
          fileName: uniqueFileName,
          fileSize: fileBuffer.length,
          mimeType: this.getMimeType(fileExtension)
        };
      } else {
        throw new Error(`GitLab upload failed with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error uploading ${imageType} to GitLab:`, error.message);
      
      if (error.response) {
        console.error('GitLab API Error:', error.response.data);
        throw new Error(`GitLab API Error: ${error.response.data.message || error.response.statusText}`);
      }
      
      throw new Error(`Failed to upload image to GitLab: ${error.message}`);
    }
  }

  /**
   * Get image from GitLab repository
   * @param {string} gitlabFilePath - GitLab file path
   * @returns {Promise<Buffer>} Image file buffer
   */
  async getImage(gitlabFilePath) {
    try {
      const encodedFilePath = encodeURIComponent(gitlabFilePath);
      
      console.log(`📥 Fetching image from GitLab: ${gitlabFilePath}`);
      
      const response = await this.client.get(
        `/projects/${this.projectId}/repository/files/${encodedFilePath}/raw`,
        {
          params: { ref: this.branch },
          responseType: 'arraybuffer'
        }
      );

      if (response.status === 200) {
        console.log(`✅ Successfully fetched image from GitLab`);
        return Buffer.from(response.data);
      } else {
        throw new Error(`GitLab fetch failed with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error fetching image from GitLab:`, error.message);
      
      if (error.response?.status === 404) {
        throw new Error('Image not found in GitLab repository');
      }
      
      throw new Error(`Failed to fetch image from GitLab: ${error.message}`);
    }
  }

  /**
   * Delete image from GitLab repository
   * @param {string} gitlabFilePath - GitLab file path
   * @returns {Promise<boolean>} Success status
   */
  async deleteImage(gitlabFilePath) {
    try {
      const encodedFilePath = encodeURIComponent(gitlabFilePath);
      
      console.log(`🗑️ Deleting image from GitLab: ${gitlabFilePath}`);
      
      const response = await this.client.delete(
        `/projects/${this.projectId}/repository/files/${encodedFilePath}`,
        {
          data: {
            branch: this.branch,
            commit_message: `Delete image: ${path.basename(gitlabFilePath)}`
          }
        }
      );

      if (response.status === 204) {
        console.log(`✅ Successfully deleted image from GitLab`);
        return true;
      } else {
        throw new Error(`GitLab delete failed with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error deleting image from GitLab:`, error.message);
      throw new Error(`Failed to delete image from GitLab: ${error.message}`);
    }
  }

  /**
   * Generate public URL for GitLab file
   * @param {string} gitlabFilePath - GitLab file path
   * @returns {string} Public URL
   */
  generateImageUrl(gitlabFilePath) {
    // GitLab raw file URL format
    const baseUrl = this.apiUrl.replace('/api/v4', '');
    const encodedPath = encodeURIComponent(gitlabFilePath);
    return `${baseUrl}/api/v4/projects/${this.projectId}/repository/files/${encodedPath}/raw?ref=${this.branch}`;
  }

  /**
   * Get MIME type from file extension
   * @param {string} extension - File extension
   * @returns {string} MIME type
   */
  getMimeType(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Upload temporary image (before property creation)
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} fileName - Original file name
   * @param {string} tempPropertyId - Temporary property ID
   * @param {string} imageType - Type of image (owner_photo, signature, sketch_photo)
   * @returns {Promise<Object>} Upload result with GitLab file path and URL
   */
  async uploadTempImage(fileBuffer, fileName, tempPropertyId, imageType) {
    try {
      // Generate file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${imageType}_${timestamp}${fileExtension}`;
      
      // Create temporary file path
      const gitlabFilePath = `${this.repoPath}/temp/${tempPropertyId}/${uniqueFileName}`;
      
      // Encode file path for GitLab API
      const encodedFilePath = encodeURIComponent(gitlabFilePath);
      
      // Prepare file data for GitLab API
      const fileData = {
        branch: this.branch,
        content: fileBuffer.toString('base64'),
        encoding: 'base64',
        commit_message: `Upload temporary ${imageType} for ${tempPropertyId}`,
        author_email: 'system@surveyapp.com',
        author_name: 'Survey App System'
      };

      console.log(`📤 Uploading temporary ${imageType} to GitLab: ${gitlabFilePath}`);
      
      // Upload to GitLab
      const response = await this.client.post(
        `/projects/${this.projectId}/repository/files/${encodedFilePath}`,
        fileData
      );

      if (response.status === 201) {
        // Generate public URL for the image
        const publicUrl = this.generateImageUrl(gitlabFilePath);
        
        console.log(`✅ Successfully uploaded temporary ${imageType} to GitLab`);
        console.log(`🔗 Public URL: ${publicUrl}`);
        
        return {
          success: true,
          gitlabFilePath: gitlabFilePath,
          gitlabUrl: publicUrl,
          fileName: uniqueFileName,
          fileSize: fileBuffer.length,
          mimeType: this.getMimeType(fileExtension)
        };
      } else {
        throw new Error(`GitLab upload failed with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error uploading temporary ${imageType} to GitLab:`, error.message);
      
      if (error.response) {
        console.error('GitLab API Error:', error.response.data);
        throw new Error(`GitLab API Error: ${error.response.data.message || error.response.statusText}`);
      }
      
      throw new Error(`Failed to upload temporary image to GitLab: ${error.message}`);
    }
  }

  /**
   * Move temporary image to property folder
   * @param {string} tempFilePath - Temporary file path
   * @param {string} propertyId - Final property ID
   * @returns {Promise<Object>} Move result with new file path
   */
  async moveTempImageToProperty(tempFilePath, propertyId) {
    try {
      // Get the temporary image
      const tempImage = await this.getImage(tempFilePath);
      
      // Extract file name from temp path
      const fileName = path.basename(tempFilePath);
      const imageType = fileName.split('_')[0]; // Extract image type from filename
      
      // Create new path with property ID
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const newFilePath = `${this.repoPath}/${year}/${month}/${propertyId}/${fileName}`;
      
      // Upload to new location
      const uploadResult = await this.uploadImage(tempImage, fileName, propertyId, imageType);
      
      // Delete temporary file
      await this.deleteImage(tempFilePath);
      
      console.log(`✅ Moved temporary image from ${tempFilePath} to ${newFilePath}`);
      
      return uploadResult;
      
    } catch (error) {
      console.error(`❌ Error moving temporary image:`, error.message);
      throw new Error(`Failed to move temporary image: ${error.message}`);
    }
  }

  /**
   * Validate file before upload
   * @param {Object} file - File object
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type. Only images are allowed' };
    }
    
    return { valid: true };
  }
}

module.exports = new GitLabService();
