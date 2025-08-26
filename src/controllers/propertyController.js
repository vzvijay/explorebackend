const { Property, PropertyImage, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../database/config');

// Create new property survey
const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const propertyData = {
      ...req.body,
      surveyed_by: req.user.id,
      survey_date: new Date()
    };

    // Generate unique property ID if not provided
    if (!propertyData.property_id) {
      const currentYear = new Date().getFullYear();
      const count = await Property.count({
        where: {
          assessment_year: currentYear
        }
      });
      propertyData.property_id = `MH${currentYear}${String(count + 1).padStart(6, '0')}`;
    }

    const property = await Property.create(propertyData);

    res.status(201).json({
      success: true,
      message: 'Property survey created successfully',
      data: { property }
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      surveyed_by,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) where.survey_status = status;
    if (property_type) where.property_type = property_type;
    if (ward_number) where.ward_number = ward_number;
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
    console.error('Get properties error:', error);
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

    const property = await Property.findByPk(id, {
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
          as: 'images'
        }
      ]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: { property }
    });

  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update property
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
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user can edit (field executives can only edit draft status)
    if (req.user.role === 'field_executive') {
      if (property.survey_status !== 'draft') {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit submitted property'
        });
      }
      if (property.surveyed_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await property.update(req.body);

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property }
    });

  } catch (error) {
    console.error('Update property error:', error);
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
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.survey_status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Property is already submitted'
      });
    }

    await property.update({
      survey_status: 'submitted'
    });

    res.json({
      success: true,
      message: 'Property submitted for review successfully',
      data: { property }
    });

  } catch (error) {
    console.error('Submit property error:', error);
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

    const property = await Property.findByPk(id);

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
    console.error('Review property error:', error);
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
    console.error('Get dashboard stats error:', error);
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