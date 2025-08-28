const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Survey Identification
  survey_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  old_mc_property_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  register_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Owner Information
  owner_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  owner_father_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aadhar_number: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^\d{4}-\d{4}-\d{4}$/
    }
  },
  
  // Property Address
  house_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  street_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  locality: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ward_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Zone Information
  zone: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'A',
    validate: {
      is: /^[A-Z]$/  // Only A-Z allowed
    }
  },
  
  // Property Details
  property_type: {
    type: DataTypes.ENUM('residential', 'commercial', 'industrial', 'mixed', 'institutional'),
    allowNull: false
  },
  construction_type: {
    type: DataTypes.ENUM('rcc', 'load_bearing', 'tin_patra', 'kaccha'),
    allowNull: true
  },
  construction_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  number_of_floors: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  
  // Building Permission
  building_permission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bp_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bp_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Area Measurements
  plot_area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  built_up_area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  carpet_area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  // Property Use Details (JSON field for dynamic rooms)
  property_use_details: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      halls: [],
      bedrooms: [],
      kitchens: [],
      shops: [],
      bathrooms: []
    }
  },
  
  // Utility Connections
  water_connection: {
    type: DataTypes.INTEGER, // 1, 2, or 3
    allowNull: true
  },
  water_connection_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  water_connection_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  electricity_connection: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  electricity_connection_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sewage_connection: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  solar_panel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rain_water_harvesting: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Location
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  
  // Photos and Signatures
  owner_tenant_photo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  signature_data: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Sketch Photo (Hand-drawn sketch before digital signature)
  sketch_photo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to hand-drawn sketch photo file (legacy support)'
  },
  sketch_photo_base64: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Base64 encoded sketch photo data'
  },
  sketch_photo_captured_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when sketch photo was captured'
  },
  
  // Tax Assessment
  assessment_year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estimated_tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  
  // Survey Status
  survey_status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected'),
    defaultValue: 'draft'
  },
  
  // Admin Approval Workflow
  approval_status: {
    type: DataTypes.ENUM('pending_approval', 'approved', 'rejected'),
    defaultValue: 'pending_approval',
    comment: 'Current approval status for admin workflow'
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of admin user who approved/rejected the survey'
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when survey was approved/rejected'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for rejection if survey was rejected'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes from admin during approval process'
  },
  
  // Additional Information
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Survey Metadata
  surveyed_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  review_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  survey_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  // Edit Tracking for Always Editable System
  last_edit_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comment required for post-submission edits'
  },
  last_edit_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of last edit'
  },
  last_edit_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who made the last edit'
  },
  edit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times this property has been edited'
  }
}, {
  tableName: 'properties',
  timestamps: true,
  underscored: true
});

module.exports = Property; 