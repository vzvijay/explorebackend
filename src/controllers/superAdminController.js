const { Property, PropertyImage, User } = require('../models');
const { Op } = require('sequelize');
const gitlabService = require('../services/gitlabService');

/**
 * Super Admin Controller
 * Handles hard delete operations for super admin users
 * 
 * PRODUCTION ENABLED - Super admin functionality for production use
 */

/**
 * Hard delete a property and all associated data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const hardDeleteProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const superAdminUserId = req.user.id;

    console.log(`🗑️ Super Admin ${superAdminUserId} attempting hard delete of property: ${propertyId}`);

    // Find the property with all associated images
    const property = await Property.findOne({ 
      where: { 
        property_id: propertyId
      },
      include: [
        {
          model: PropertyImage,
          as: 'images',
          required: false
        }
      ]
    });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    console.log(`📋 Property found: ${property.survey_number} (${property.owner_name})`);
    console.log(`📸 Associated images: ${property.images ? property.images.length : 0}`);

    // Start transaction for atomic operation
    const transaction = await Property.sequelize.transaction();

    try {
      // Step 1: Delete images from GitLab (if any)
      let gitlabDeletionResult = null;
      if (property.images && property.images.length > 0) {
        console.log(`🗑️ Deleting ${property.images.length} images from GitLab...`);
        
        const imagePaths = property.images
          .filter(img => img.gitlab_file_path)
          .map(img => img.gitlab_file_path);
        
        if (imagePaths.length > 0) {
          gitlabDeletionResult = await gitlabService.deleteMultipleImages(imagePaths, 2);
          console.log(`📊 GitLab deletion result: ${gitlabDeletionResult.successful}/${gitlabDeletionResult.total} successful`);
        }
      }

      // Step 2: Delete property images from database
      if (property.images && property.images.length > 0) {
        console.log(`🗑️ Deleting ${property.images.length} property image records from database...`);
        await PropertyImage.destroy({
          where: { property_id: propertyId },
          transaction
        });
      }

      // Step 3: Delete the property from database
      console.log(`🗑️ Deleting property record from database...`);
      await Property.destroy({
        where: { property_id: propertyId },
        transaction
      });

      // Commit transaction
      await transaction.commit();

      console.log(`✅ Hard delete completed successfully for property: ${propertyId}`);

      // Prepare response
      const response = {
        success: true,
        message: 'Property hard deleted successfully',
        data: {
          property_id: propertyId,
          survey_number: property.survey_number,
          owner_name: property.owner_name,
          deleted_by: superAdminUserId,
          deleted_at: new Date().toISOString(),
          images_deleted: property.images ? property.images.length : 0,
          gitlab_deletion: gitlabDeletionResult
        }
      };

      // Log the hard deletion (no audit trail as requested)
      console.log(`📝 Hard deletion completed:`, {
        propertyId,
        surveyNumber: property.survey_number,
        ownerName: property.owner_name,
        imagesDeleted: property.images ? property.images.length : 0,
        deletedBy: superAdminUserId,
        deletedAt: new Date().toISOString()
      });

      res.json(response);

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in hard delete operation:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to hard delete property',
      error: error.message
    });
  }
};

/**
 * Get properties that can be hard deleted (for super admin dashboard)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDeletableProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build search conditions
    const searchConditions = {};
    if (search) {
      searchConditions[Op.or] = [
        { survey_number: { [Op.iLike]: `%${search}%` } },
        { owner_name: { [Op.iLike]: `%${search}%` } },
        { locality: { [Op.iLike]: `%${search}%` } },
        { property_id: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get properties with pagination
    const { count, rows: properties } = await Property.findAndCountAll({
      where: searchConditions,
      include: [
        {
          model: User,
          as: 'surveyor',
          attributes: ['first_name', 'last_name', 'email', 'role']
        },
        {
          model: PropertyImage,
          as: 'images',
          required: false,
          attributes: ['id', 'image_type', 'gitlab_file_path']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Format response
    const formattedProperties = properties.map(property => ({
      id: property.id,
      property_id: property.property_id,
      survey_number: property.survey_number,
      owner_name: property.owner_name,
      locality: property.locality,
      zone: property.zone,
      property_type: property.property_type,
      status: property.status,
      survey_date: property.survey_date,
      created_at: property.created_at,
      surveyor: property.surveyor ? {
        name: `${property.surveyor.first_name} ${property.surveyor.last_name}`,
        email: property.surveyor.email,
        role: property.surveyor.role
      } : null,
      image_count: property.images ? property.images.length : 0,
      has_images: property.images && property.images.length > 0
    }));

    res.json({
      success: true,
      data: {
        properties: formattedProperties,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting deletable properties:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get deletable properties',
      error: error.message
    });
  }
};

module.exports = {
  hardDeleteProperty,
  getDeletableProperties
};
