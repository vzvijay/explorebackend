const User = require('./User');
const Property = require('./Property');
const PropertyImage = require('./PropertyImage');

// Define associations
// User-Property relationships
User.hasMany(Property, { foreignKey: 'surveyed_by', as: 'surveyed_properties' });
User.hasMany(Property, { foreignKey: 'reviewed_by', as: 'reviewed_properties' });
User.hasMany(Property, { foreignKey: 'approved_by', as: 'approved_properties' });
Property.belongsTo(User, { foreignKey: 'surveyed_by', as: 'surveyor' });
Property.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
Property.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Property-PropertyImage relationships
Property.hasMany(PropertyImage, { foreignKey: 'property_id', as: 'images' });
PropertyImage.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// User-PropertyImage relationships
User.hasMany(PropertyImage, { foreignKey: 'uploaded_by', as: 'uploaded_images' });
PropertyImage.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

module.exports = {
  User,
  Property,
  PropertyImage
}; 