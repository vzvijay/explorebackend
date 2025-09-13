const Property = require('../models/Property');
const User = require('../models/User');
const { Op } = require('sequelize');

/**
 * Admin Controller
 * Handles admin approval workflow and administrative operations
 */

// Get pending approvals with filtering
const getPendingApprovals = async (req, res) => {
  try {
    const {
      zone,
      property_type,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Build filter conditions
    const whereClause = {
      approval_status: 'pending_approval'
    };

    if (zone) {
      whereClause.zone = zone;
    }

    if (property_type) {
      whereClause.property_type = property_type;
    }

    // Pagination
    const offset = (page - 1) * limit;
    const order = [[sort_by, sort_order.toUpperCase()]];

    // Get pending approvals with user details
    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'surveyor',
          attributes: ['id', 'first_name', 'last_name', 'employee_id', 'role']
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          has_next: hasNextPage,
          has_prev: hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};

// Approve a property survey
const approveProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { admin_notes } = req.body;
    const adminUserId = req.user.id;

    // Find the property
    const property = await Property.findOne({ where: { property_id: propertyId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if property is already approved/rejected
    if (property.approval_status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Property is already ${property.approval_status}`,
        current_status: property.approval_status
      });
    }

    // Update property with approval details
    await property.update({
      approval_status: 'approved',
      approved_by: adminUserId,
      approved_at: new Date(),
      admin_notes: admin_notes || null,
      survey_status: 'approved'
    });

    res.json({
      success: true,
      message: 'Property survey approved successfully',
      data: {
        property_id: property.id,
        survey_number: property.survey_number,
        approved_by: adminUserId,
        approved_at: property.approved_at,
        admin_notes: property.admin_notes
      }
    });

  } catch (error) {
    console.error('Error approving property:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve property survey',
      error: error.message
    });
  }
};

// Reject a property survey
const rejectProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { rejection_reason, admin_notes } = req.body;
    const adminUserId = req.user.id;

    // Validate required fields
    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find the property
    const property = await Property.findOne({ where: { property_id: propertyId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if property is already approved/rejected
    if (property.approval_status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Property is already ${property.approval_status}`,
        current_status: property.approval_status
      });
    }

    // Update property with rejection details
    await property.update({
      approval_status: 'rejected',
      approved_by: adminUserId,
      approved_at: new Date(),
      rejection_reason: rejection_reason.trim(),
      admin_notes: admin_notes || null,
      survey_status: 'rejected'
    });

    res.json({
      success: true,
      message: 'Property survey rejected successfully',
      data: {
        property_id: property.id,
        survey_number: property.survey_number,
        rejected_by: adminUserId,
        rejected_at: property.approved_at,
        rejection_reason: property.rejection_reason,
        admin_notes: property.admin_notes
      }
    });

  } catch (error) {
    console.error('Error rejecting property:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reject property survey',
      error: error.message
    });
  }
};

// Get approval statistics
const getApprovalStats = async (req, res) => {
  try {
    const { zone, property_type, date_from, date_to } = req.query;

    // Build filter conditions
    const whereClause = {};
    if (zone) whereClause.zone = zone;
    if (property_type) whereClause.property_type = property_type;
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }

    // Get counts for each approval status
    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      Property.count({ where: { ...whereClause, approval_status: 'pending_approval' } }),
      Property.count({ where: { ...whereClause, approval_status: 'approved' } }),
      Property.count({ where: { ...whereClause, approval_status: 'rejected' } }),
      Property.count({ where: whereClause })
    ]);

    // Get zone-wise distribution
    const zoneStats = await Property.findAll({
      attributes: [
        'zone',
        'approval_status',
        [Property.sequelize.fn('COUNT', Property.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['zone', 'approval_status'],
      order: [['zone', 'ASC']]
    });

    // Get property type distribution
    const typeStats = await Property.findAll({
      attributes: [
        'property_type',
        'approval_status',
        [Property.sequelize.fn('COUNT', Property.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['property_type', 'approval_status'],
      order: [['property_type', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        summary: {
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          approval_rate: totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(2) : 0
        },
        zone_distribution: zoneStats,
        type_distribution: typeStats
      }
    });

  } catch (error) {
    console.error('Error fetching approval stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval statistics',
      error: error.message
    });
  }
};

// Get property details for approval review
const getPropertyForApproval = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findOne({ 
      where: { property_id: propertyId },
      include: [
        {
          model: User,
          as: 'surveyor',
          attributes: ['id', 'first_name', 'last_name', 'employee_id', 'role', 'department']
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
      data: {
        property
      }
    });

  } catch (error) {
    console.error('Error fetching property for approval:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property details',
      error: error.message
    });
  }
};

module.exports = {
  getPendingApprovals,
  approveProperty,
  rejectProperty,
  getApprovalStats,
  getPropertyForApproval
};
