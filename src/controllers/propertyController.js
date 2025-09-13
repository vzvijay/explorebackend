const { Property, User, PropertyImage } = require('../models');
const { validationResult } = require('express-validator');
const { moveTempImagesToProperty } = require('./imageController');
const { Op } = require('sequelize');
const sequelize = require('../database/config');

// Create new property survey
const createProperty = async (req, res) => {
  try {
    // Validation check (debug logging removed for production)
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Extract property data (no base64 fields)
    const propertyData = req.body;
    
    // Add system fields
    propertyData.surveyed_by = req.user.id;
    propertyData.survey_date = new Date();
    
    // Set sketch_photo_captured_at if sketch_photo_image_id is provided
    if (propertyData.sketch_photo_image_id) {
      propertyData.sketch_photo_captured_at = new Date();
    }

    // Validate property_id is provided and unique
    if (!propertyData.property_id) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    // Check if property_id already exists
    const existingProperty = await Property.findOne({
      where: { property_id: propertyData.property_id }
    });

    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'Property ID already exists'
      });
    }

    // Debug and validate date fields
    const dateFields = ['bp_date', 'water_connection_date', 'sketch_photo_captured_at', 'approved_at', 'survey_date', 'last_edit_date'];
    // Process date fields (debug logging removed for production)
    dateFields.forEach(field => {
      if (propertyData[field]) {
        
        // Convert string dates to Date objects if needed
        if (typeof propertyData[field] === 'string') {
          let dateValue;
          
          // Check if it's in DD/MM/YYYY or DD-MM-YYYY format
          const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
          const match = propertyData[field].match(ddmmyyyyRegex);
          
          if (match) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            const isoDateString = `${year}-${month}-${day}`;
            dateValue = new Date(isoDateString);
            console.log(`    🔄 Converted DD/MM/YYYY or DD-MM-YYYY format: ${propertyData[field]} → ${isoDateString}`);
          } else {
            // Try parsing as-is
            dateValue = new Date(propertyData[field]);
          }
          
          if (isNaN(dateValue.getTime())) {
            console.log(`    ❌ Invalid date string: ${propertyData[field]}`);
            propertyData[field] = null; // Set to null if invalid
          } else {
            propertyData[field] = dateValue;
            console.log(`    ✅ Converted to valid date: ${dateValue.toISOString()}`);
          }
        } else if (propertyData[field] instanceof Date) {
          console.log(`    Valid Date: ${!isNaN(propertyData[field].getTime())}`);
        }
      }
    });

    // Creating property with validated data

    const property = await Property.create(propertyData);

    // Property created successfully

    // No temporary image migration needed - images are uploaded directly with property_id

    res.status(201).json({
      success: true,
      message: 'Property survey created successfully',
      data: { property }
    });

  } catch (error) {
    console.error('Create property error:', error.message);
    
    // Handle validation errors specifically
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }
    
    // Handle database constraint errors
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        success: false,
        message: 'Database constraint error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all properties (with filtering and pagination)
const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      property_type,
      ward_number,
      zone,
      surveyed_by,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) where.survey_status = status;
    if (property_type) where.property_type = property_type;
    if (ward_number) where.ward_number = ward_number;
    if (zone) where.zone = zone;
    if (surveyed_by) where.surveyed_by = surveyed_by;

    // Search functionality
    if (search) {
      where[Op.or] = [
        { owner_name: { [Op.iLike]: `%${search}%` } },
        { property_id: { [Op.iLike]: `%${search}%` } },
        { survey_number: { [Op.iLike]: `%${search}%` } },
        { locality: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'field_executive') {
      where.surveyed_by = req.user.id;
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'surveyor',
          attributes: ['first_name', 'last_name', 'employee_id']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['first_name', 'last_name', 'employee_id']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get properties error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    // Getting property by ID - handle both UUID and property_id
    
    // Check if id is a UUID (contains hyphens and lowercase letters)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const whereClause = isUUID ? { id: id } : { property_id: id };
    
    console.log('getPropertyById - id:', id, 'isUUID:', isUUID, 'whereClause:', whereClause);

    const property = await Property.findOne({ 
      where: whereClause,
      include: [
        {
          model: User,
          as: 'surveyor',
          attributes: ['first_name', 'last_name', 'employee_id', 'phone']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['first_name', 'last_name', 'employee_id']
        },
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'image_type', 'gitlab_url', 'file_name', 'uploaded_at'],
          order: [['uploaded_at', 'DESC']]
        }
      ]
    });

    // Property found with images

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check access permissions for field executives
    if (req.user.role === 'field_executive' && property.surveyed_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access your own surveys'
      });
    }

    res.json({
      success: true,
      data: { property }
    });

  } catch (error) {
    console.error('Get property by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update property (Always Editable System)
const updateProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { edit_comment, ...updateData } = req.body;
    
    // Convert date fields from DD/MM/YYYY to proper format
    const dateFields = ['bp_date', 'water_connection_date', 'sketch_photo_captured_at', 'approved_at', 'survey_date', 'last_edit_date'];
    dateFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        // Check if it's in DD/MM/YYYY or DD-MM-YYYY format
        const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const match = updateData[field].match(ddmmyyyyRegex);
        
        if (match) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          const isoDateString = `${year}-${month}-${day}`;
          updateData[field] = new Date(isoDateString);
          // Converted date format
        } else {
          // Try parsing as-is
          const dateValue = new Date(updateData[field]);
          if (!isNaN(dateValue.getTime())) {
            updateData[field] = dateValue;
          }
        }
      }
    });
    
    const property = await Property.findOne({ where: { property_id: id } });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Always Editable System: Field executives can edit any status
    if (req.user.role === 'field_executive') {
      // Check ownership
      if (property.surveyed_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only edit your own surveys'
        });
      }

      // Comment is mandatory for post-submission edits
      if (property.survey_status !== 'draft' && !edit_comment) {
        return res.status(400).json({
          success: false,
          message: 'Edit comment is mandatory for post-submission edits'
        });
      }

      // Update edit tracking fields
      updateData.last_edit_comment = edit_comment || null;
      updateData.last_edit_date = new Date();
      updateData.last_edit_by = req.user.id;
      updateData.edit_count = (property.edit_count || 0) + 1;
    }

    await property.update(updateData);

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property }
    });

  } catch (error) {
    console.error('Update property error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit property for review
const submitProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ where: { property_id: id } });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Always Editable System: Field executives can submit properties in any status
    if (req.user.role === 'field_executive') {
      // Check ownership
      if (property.surveyed_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only submit your own surveys'
        });
      }

      // For field executives, allow submission regardless of current status
      await property.update({
        survey_status: 'submitted',
        approval_status: 'pending_approval'
      });

      res.json({
        success: true,
        message: 'Property submitted for review successfully',
        data: { property }
      });
    } else {
      // For other roles, maintain original logic
      if (property.survey_status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Property is already submitted'
        });
      }

      await property.update({
        survey_status: 'submitted',
        approval_status: 'pending_approval'
      });

      res.json({
        success: true,
        message: 'Property submitted for review successfully',
        data: { property }
      });
    }

  } catch (error) {
    console.error('Submit property error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Review property (approve/reject)
const reviewProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'approve' or 'reject'

    const property = await Property.findOne({ where: { property_id: id } });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.survey_status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Property is not in submitted status'
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await property.update({
      survey_status: newStatus,
      reviewed_by: req.user.id,
      review_date: new Date(),
      remarks: remarks || property.remarks
    });

    res.json({
      success: true,
      message: `Property ${action}d successfully`,
      data: { property }
    });

  } catch (error) {
    console.error('Review property error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const currentYear = new Date().getFullYear();
    
    let whereClause = { assessment_year: currentYear };
    
    // Filter by user role
    if (role === 'field_executive') {
      whereClause.surveyed_by = userId;
    }

    const stats = await Property.findAll({
      attributes: [
        'survey_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['survey_status'],
      raw: true
    });

    const totalProperties = stats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

    const formattedStats = {
      total_properties: totalProperties,
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      formattedStats[stat.survey_status] = parseInt(stat.count);
    });

    res.json({
      success: true,
      data: { stats: formattedStats }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  submitProperty,
  reviewProperty,
  getDashboardStats
}; 