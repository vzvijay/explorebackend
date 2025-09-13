const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles, checkPropertyAccess } = require('../middleware/auth');
const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  submitProperty,
  reviewProperty,
  getDashboardStats
} = require('../controllers/propertyController');

const router = express.Router();

// Middleware to clean empty strings before validation
const cleanEmptyStrings = (req, res, next) => {
  // Clean empty strings for optional fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] === '') {
      req.body[key] = null;
    }
  });
  next();
};

// Property validation rules
const propertyValidation = [
  // Property Identification
  body('property_id')
    .notEmpty()
    .withMessage('Property ID is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Property ID must be between 3 and 100 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Property ID can only contain uppercase letters, numbers, hyphens, and underscores'),
  // Basic Information
  body('survey_number')
    .notEmpty()
    .withMessage('Survey number is required'),
  body('old_mc_property_number')
    .optional()
    .isLength({ max: 50 }),
  body('register_no')
    .optional()
    .isLength({ max: 50 }),
  body('owner_name')
    .isLength({ max: 100 })
    .withMessage('Owner name must be less than 100 characters'),
  body('owner_father_name')
    .optional()
    .isLength({ max: 100 }),
  body('owner_phone')
    .optional()
    .isLength({ max: 15 }),
  body('owner_email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('aadhar_number')
    .optional()
    .matches(/^\d{4}-\d{4}-\d{4}$/)
    .withMessage('Aadhar number must be in format 1234-5678-9012'),
  
  // Address
  body('house_number')
    .optional()
    .isLength({ max: 20 }),
  body('street_name')
    .optional()
    .isLength({ max: 100 }),
  body('locality')
    .notEmpty()
    .withMessage('Locality is required'),
  body('ward_number')
    .isInt({ min: 1 })
    .withMessage('Valid ward number is required'),
  body('pincode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Pincode must be 6 digits'),
  
  // Property Details
  body('property_type')
    .isIn(['residential', 'commercial', 'industrial', 'mixed', 'institutional'])
    .withMessage('Valid property type is required'),
  body('construction_type')
    .optional()
    .isIn(['rcc', 'load_bearing', 'tin_patra', 'kaccha'])
    .withMessage('Valid construction type is required'),
  body('construction_year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Valid construction year is required'),
  body('number_of_floors')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of floors must be between 1 and 20'),
  
  // Building Permission
  body('building_permission')
    .optional()
    .isBoolean(),
  body('bp_number')
    .optional()
    .isLength({ max: 50 }),
  body('bp_date')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty/null values
      }
      // Check if it's a valid date string
      if (value === 'Invalid date' || value === 'undefined' || value === 'null') {
        return false; // Reject invalid date strings
      }
      // Accept DD/MM/YYYY format and convert to ISO
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const match = value.match(ddmmyyyyRegex);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const isoDateString = `${year}-${month}-${day}`;
        const dateValue = new Date(isoDateString);
        return !isNaN(dateValue.getTime());
      }
      // If value exists, validate as ISO date
      return require('validator').isISO8601(value);
    })
    .withMessage('Valid date format required (DD/MM/YYYY or YYYY-MM-DD) or leave empty'),
  
  // Area Measurements
  body('plot_area')
    .isFloat({ min: 0 })
    .withMessage('Plot area must be a positive number'),
  body('built_up_area')
    .isFloat({ min: 0 })
    .withMessage('Built-up area must be a positive number'),
  body('carpet_area')
    .isFloat({ min: 0 })
    .withMessage('Carpet area must be a positive number'),
  
  // Property Use Details (JSON)
  body('property_use_details')
    .optional()
    .isObject(),
  
  // Utility Connections
  body('water_connection')
    .optional()
    .isIn([0, 1, 2, 3]),
  body('water_connection_number')
    .optional()
    .isLength({ max: 50 }),
  body('water_connection_date')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty/null values
      }
      // Check if it's a valid date string
      if (value === 'Invalid date' || value === 'undefined' || value === 'null') {
        return false; // Reject invalid date strings
      }
      // Accept DD/MM/YYYY format and convert to ISO
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const match = value.match(ddmmyyyyRegex);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const isoDateString = `${year}-${month}-${day}`;
        const dateValue = new Date(isoDateString);
        return !isNaN(dateValue.getTime());
      }
      // If value exists, validate as ISO date
      return require('validator').isISO8601(value);
    })
    .withMessage('Valid date format required (DD/MM/YYYY or YYYY-MM-DD) or leave empty'),
  body('electricity_connection')
    .optional()
    .isBoolean(),
  body('electricity_connection_number')
    .optional()
    .isLength({ max: 50 }),
  body('sewage_connection')
    .optional()
    .isBoolean(),
  body('solar_panel')
    .optional()
    .isBoolean(),
  body('rain_water_harvesting')
    .optional()
    .isBoolean(),
  
  // Location
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }),
  
  // Photos and Signatures
  body('owner_tenant_photo')
    .optional()
    .isLength({ max: 1000000 }),
  body('sketch_photo')
    .optional()
    .isLength({ max: 1000000 }),
  body('signature_data')
    .optional()
    .isLength({ max: 1000000 }),
  
  // Additional
  body('assessment_year')
    .optional()
    .isInt({ min: 2020, max: 2030 }),
  body('estimated_tax')
    .optional()
    .isFloat({ min: 0 }),
  body('remarks')
    .optional()
    .isLength({ max: 1000 }),
  
  // Address fields from GPS lookup
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('street_address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  body('postal_code')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Postal code cannot exceed 10 characters'),
  body('ward_number_from_gps')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ward number cannot exceed 50 characters'),
  body('area_from_gps')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Area cannot exceed 100 characters')
];

// Temporary lenient validation rules for debugging
const lenientPropertyValidation = [
  // Only validate the most critical fields
  body('owner_name')
    .notEmpty()
    .withMessage('Owner name is required'),
  body('locality')
    .notEmpty()
    .withMessage('Locality is required'),
  // Make all other fields optional for now
];

// Property update validation (partial)
const propertyUpdateValidation = [
  // Basic Information
  body('survey_number')
    .optional()
    .isLength({ max: 50 }),
  body('old_mc_property_number')
    .optional()
    .isLength({ max: 50 }),
  body('register_no')
    .optional()
    .isLength({ max: 50 }),
  body('owner_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Owner name must be less than 100 characters'),
  body('owner_father_name')
    .optional()
    .isLength({ max: 100 }),
  body('owner_phone')
    .optional()
    .isLength({ max: 15 }),
  body('owner_email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('aadhar_number')
    .optional()
    .matches(/^\d{4}-\d{4}-\d{4}$/)
    .withMessage('Aadhar number must be in format 1234-5678-9012'),
  
  // Address
  body('house_number')
    .optional()
    .isLength({ max: 20 }),
  body('street_name')
    .optional()
    .isLength({ max: 100 }),
  body('locality')
    .optional()
    .notEmpty()
    .withMessage('Locality cannot be empty'),
  body('ward_number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid ward number is required'),
  body('pincode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Pincode must be 6 digits'),
  body('zone')
    .optional()
    .isIn(['A', 'B', 'C', 'D']),
  
  // Property Details
  body('property_type')
    .optional()
    .isIn(['residential', 'commercial', 'industrial', 'mixed', 'institutional'])
    .withMessage('Valid property type is required'),
  body('plot_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Plot area must be a positive number'),
  body('built_up_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Built-up area must be a positive number'),
  body('carpet_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Carpet area must be a positive number'),
  
  // Additional fields that frontend sends during updates
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }),
  body('signature_data')
    .optional()
    .isLength({ max: 1000000 }),
  body('owner_tenant_photo')
    .optional()
    .isLength({ max: 1000000 }),
  body('sketch_photo')
    .optional()
    .isLength({ max: 1000000 }),
  body('assessment_year')
    .optional()
    .isInt({ min: 2020, max: 2030 }),
  body('estimated_tax')
    .optional()
    .isFloat({ min: 0 }),
  body('property_use_details')
    .optional()
    .isObject(),
  body('construction_type')
    .optional()
    .isIn(['rcc', 'load_bearing', 'tin_patra', 'kaccha']),
  body('construction_year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() }),
  body('number_of_floors')
    .optional()
    .isInt({ min: 1, max: 20 }),
  body('building_permission')
    .optional()
    .isBoolean(),
  body('bp_number')
    .optional()
    .isLength({ max: 50 }),
  body('bp_date')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty/null values
      }
      // Check if it's a valid date string
      if (value === 'Invalid date' || value === 'undefined' || value === 'null') {
        return false; // Reject invalid date strings
      }
      // Accept DD/MM/YYYY format and convert to ISO
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const match = value.match(ddmmyyyyRegex);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const isoDateString = `${year}-${month}-${day}`;
        const dateValue = new Date(isoDateString);
        return !isNaN(dateValue.getTime());
      }
      // If value exists, validate as ISO date
      return require('validator').isISO8601(value);
    })
    .withMessage('Valid date format required (DD/MM/YYYY or YYYY-MM-DD) or leave empty'),
  body('water_connection')
    .optional()
    .isIn([0, 1, 2, 3]),
  body('water_connection_number')
    .optional()
    .isLength({ max: 50 }),
  body('water_connection_date')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty/null values
      }
      // Check if it's a valid date string
      if (value === 'Invalid date' || value === 'undefined' || value === 'null') {
        return false; // Reject invalid date strings
      }
      // Accept DD/MM/YYYY format and convert to ISO
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const match = value.match(ddmmyyyyRegex);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const isoDateString = `${year}-${month}-${day}`;
        const dateValue = new Date(isoDateString);
        return !isNaN(dateValue.getTime());
      }
      // If value exists, validate as ISO date
      return require('validator').isISO8601(value);
    })
    .withMessage('Valid date format required (DD/MM/YYYY or YYYY-MM-DD) or leave empty'),
  body('electricity_connection')
    .optional()
    .isBoolean(),
  body('electricity_connection_number')
    .optional()
    .isLength({ max: 50 }),
  body('sewage_connection')
    .optional()
    .isBoolean(),
  body('solar_panel')
    .optional()
    .isBoolean(),
  body('rain_water_harvesting')
    .optional()
    .isBoolean(),
  body('remarks')
    .optional()
    .isLength({ max: 1000 }),
  body('edit_comment')
    .optional()
    .isLength({ max: 1000 }),
  
  // Address fields from GPS lookup - Add missing validation
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('street_address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  body('postal_code')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Postal code cannot exceed 10 characters'),
  body('ward_number_from_gps')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ward number cannot exceed 50 characters'),
  body('area_from_gps')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Area cannot exceed 100 characters')
];

// Review validation
const reviewValidation = [
  param('id').isUUID().withMessage('Valid property ID is required'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  body('remarks')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

// Routes

// Dashboard stats (all authenticated users)
router.get('/dashboard/stats', authenticateToken, getDashboardStats);

// Get all properties with filtering
router.get('/', authenticateToken, getProperties);

// Create new property (field executives only) - TEMPORARILY USING LENIENT VALIDATION
router.post('/', 
  authenticateToken, 
  authorizeRoles('field_executive'), 
  cleanEmptyStrings,
  lenientPropertyValidation, // Use lenient validation instead of propertyValidation
  createProperty
);

// Get single property by ID
router.get('/:id', 
  authenticateToken, 
  param('id').isUUID().withMessage('Valid property ID is required'),
  checkPropertyAccess,
  getPropertyById
);

// Update property
router.put('/:id', 
  authenticateToken, 
  param('id').isUUID().withMessage('Valid property ID is required'),
  cleanEmptyStrings,
  propertyUpdateValidation,
  checkPropertyAccess,
  updateProperty
);

// Submit property for review (field executives only)
router.patch('/:id/submit', 
  authenticateToken, 
  authorizeRoles('field_executive'),
  param('id').isUUID().withMessage('Valid property ID is required'),
  checkPropertyAccess,
  submitProperty
);

// Review property (municipal officers and engineers only)
router.patch('/:id/review', 
  authenticateToken, 
  authorizeRoles('municipal_officer', 'engineer', 'admin'),
  reviewValidation,
  reviewProperty
);

module.exports = router; 