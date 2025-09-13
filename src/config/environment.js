const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Environment detection
  const environment = process.env.NODE_ENV || 'development';
  
  // Database configuration
  const databaseUrl = process.env.DATABASE_URL;
  const isLocalDatabase = databaseUrl && (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1'));
  
  // API configuration
  const apiBaseUrl = process.env.API_BASE_URL || (
    isProduction 
      ? (() => { throw new Error('API_BASE_URL environment variable is required in production'); })()
      : 'http://localhost:3000'
  );
  
  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173'
  ];
  
  // GitLab configuration
  const gitlabConfig = {
    token: process.env.GITLAB_TOKEN,
    projectId: process.env.GITLAB_PROJECT_ID,
    baseUrl: 'https://gitlab.com/api/v4'
  };
  
  // JWT configuration
  const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  };
  
  // Port configuration
  const port = process.env.PORT || 3000;
  
  // Logging configuration
  const logging = {
    level: isProduction ? 'error' : 'debug',
    enableConsole: isDevelopment
  };
  
  return {
    // Environment flags
    isProduction,
    isDevelopment,
    environment,
    
    // Database
    databaseUrl,
    isLocalDatabase,
    
    // API
    apiBaseUrl,
    port,
    
    // CORS
    corsOrigins,
    
    // External services
    gitlab: gitlabConfig,
    
    // Authentication
    jwt: jwtConfig,
    
    // Logging
    logging,
    
    // Validation
    validate: () => {
      const required = ['DATABASE_URL', 'JWT_SECRET', 'GITLAB_TOKEN', 'GITLAB_PROJECT_ID'];
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      return true;
    }
  };
};

module.exports = getEnvironmentConfig;