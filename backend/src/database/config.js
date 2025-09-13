const { Sequelize } = require('sequelize');
require('dotenv').config();

// Import environment configuration
const getEnvironmentConfig = require('../config/environment');
const config = getEnvironmentConfig();

let sequelize;

// Environment configuration loaded

// Check if DATABASE_URL is available
if (config.databaseUrl && config.databaseUrl.trim() !== '') {
  const sequelizeConfig = {
    dialect: 'postgres',
    logging: config.logging.enableConsole ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  };
  
  // Only add SSL for remote databases (production)
  if (!config.isLocalDatabase) {
    sequelizeConfig.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }
  
  sequelize = new Sequelize(config.databaseUrl, sequelizeConfig);
} else {
  // Using fallback database configuration
  // Fallback to individual environment variables (development/local)
  sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'maharashtra_survey_db',
    username: process.env.DB_USER || 'survey_user',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: config.logging.enableConsole ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

module.exports = sequelize; 