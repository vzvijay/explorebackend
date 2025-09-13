const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const PropertyImage = sequelize.define('PropertyImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  property_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    references: {
      model: 'properties',
      key: 'property_id'
    },
    comment: 'Property ID this image belongs to (e.g., PROP-2025-001)'
  },
  image_type: {
    type: DataTypes.ENUM('owner_photo', 'signature', 'sketch_photo'),
    allowNull: false,
    comment: 'Type of image: owner_photo, signature, or sketch_photo'
  },
  gitlab_file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Full path to the file in GitLab repository'
  },
  gitlab_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Public URL to access the image from GitLab'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original file name of the uploaded image'
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Local file path (legacy field, now using gitlab_file_path)'
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'File size in bytes'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'MIME type of the image file'
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who uploaded the image'
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when the image was uploaded'
  }
}, {
  tableName: 'property_images',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['property_id']
    },
    {
      fields: ['image_type']
    },
    {
      fields: ['uploaded_by']
    },
    {
      fields: ['property_id', 'image_type']
    }
  ]
});

module.exports = PropertyImage;