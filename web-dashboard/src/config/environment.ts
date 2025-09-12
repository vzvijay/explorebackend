const getEnvironmentConfig = () => {
  const isProduction = import.meta.env.MODE === 'production';
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // Environment detection
  const environment = import.meta.env.MODE || 'development';
  
  // API configuration - with fallbacks for local development
  const apiBaseUrl = import.meta.env.VITE_API_URL || (
    isProduction 
      ? 'https://explorebackend-qy7b.onrender.com'
      : 'http://localhost:3000'
  );
  
  // Frontend URL configuration - with fallbacks for local development
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || (
    isProduction
      ? 'https://web-dashboard-smoky.vercel.app'
      : 'http://localhost:3001'
  );
  
  // Environment-specific settings
  const settings = {
    enableDebugLogs: isDevelopment,
    enableConsoleLogs: isDevelopment,
    enableErrorBoundary: isProduction,
    enablePerformanceMonitoring: isProduction
  };
  
  // Image configuration
  const imageConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    quality: isProduction ? 0.8 : 0.9
  };
  
  // API configuration
  const apiConfig = {
    timeout: isProduction ? 30000 : 10000, // 30s in production, 10s in development
    retryAttempts: isProduction ? 3 : 1,
    retryDelay: 1000
  };
  
  // Validation
  const validate = () => {
    const required = ['VITE_API_URL'];
    const missing = required.filter(key => !import.meta.env[key] && isProduction);
    
    if (missing.length > 0) {
      console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    return true;
  };
  
  return {
    // Environment flags
    isProduction,
    isDevelopment,
    environment,
    
    // URLs
    apiBaseUrl,
    frontendUrl,
    
    // Settings
    settings,
    
    // Configuration
    image: imageConfig,
    api: apiConfig,
    
    // Validation
    validate
  };
};

export default getEnvironmentConfig;
