const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Property Identification
  property_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100],
      isAlphanumeric: function(value) {
        if (!value) return true;
        const propertyIdRegex = /^[A-Z0-9-_]+$/;
        if (!propertyIdRegex.test(value)) {
          throw new Error('Property ID can only contain uppercase letters, numbers, hyphens, and underscores');
        }
      }
    }
  },
  // Survey Identification
  survey_number: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined || value.trim() === '')) {
          throw new Error('Survey number is required for submitted surveys');
        }
      }
    }
    // Removed unique: true to allow duplicate survey numbers
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
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined || value.trim() === '')) {
          throw new Error('Owner name is required for submitted surveys');
        }
      }
    }
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
      isValidAadhar: function(value) {
        if (!value) return true; // Allow null/empty
        // Allow formats: 123456789012 or 1234-5678-9012
        const aadharRegex = /^(\d{12}|\d{4}-\d{4}-\d{4})$/;
        if (!aadharRegex.test(value)) {
          throw new Error('Aadhar number must be 12 digits or in format 1234-5678-9012');
        }
      }
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
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined || value.trim() === '')) {
          throw new Error('Locality is required for submitted surveys');
        }
      }
    }
  },
  ward_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined)) {
          throw new Error('Ward number is required for submitted surveys');
        }
      }
    }
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined || value.trim() === '')) {
          throw new Error('Pincode is required for submitted surveys');
        }
      }
    }
  },
  
  // Zone Information
  zone: {
    type: DataTypes.CHAR(1),
    allowNull: true,
    defaultValue: 'A',
    validate: {
      isValidZone: function(value) {
        if (!value) return true; // Allow null/empty
        // Allow single uppercase letter A-Z
        const zoneRegex = /^[A-Z]$/;
        if (!zoneRegex.test(value)) {
          throw new Error('Zone must be a single uppercase letter A-Z');
        }
      },
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined)) {
          throw new Error('Zone is required for submitted surveys');
        }
      }
    }
  },
  
  // Property Details
  property_type: {
    type: DataTypes.ENUM('residential', 'commercial', 'industrial', 'mixed', 'institutional'),
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined)) {
          throw new Error('Property type is required for submitted surveys');
        }
      }
    }
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
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined)) {
          throw new Error('Plot area is required for submitted surveys');
        }
      }
    }
  },
  built_up_area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined)) {
          throw new Error('Built-up area is required for submitted surveys');
        }
      }
    }
  },
  carpet_area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      customValidator: function(value) {
        if (this.survey_status === 'submitted' && (value === null || value === undefined)) {
          throw new Error('Carpet area is required for submitted surveys');
        }
      }
    }
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
  
  // Photos and Signatures - REMOVED: Now using GitLab storage only
  // owner_tenant_photo, signature_data, sketch_photo removed
  sketch_photo_captured_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when sketch photo was captured'
  },
  
  // Image References (GitLab-based storage)
  owner_photo_image_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'GitLab image ID for owner photo'
  },
  signature_image_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'GitLab image ID for signature'
  },
  sketch_photo_image_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'GitLab image ID for sketch photo'
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
    allowNull: true,
    defaultValue: 'pending_approval',
    field: 'approval_status'
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