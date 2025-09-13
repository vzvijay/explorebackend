const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Load environment variables - only in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './env.local' });
}

// Import environment configuration
const getEnvironmentConfig = require('./config/environment');
const config = getEnvironmentConfig();

// Import database
const sequelize = require('./database/config');

// Import models to initialize associations (only if database is available)
let modelsInitialized = false;
try {
  require('./models');
  modelsInitialized = true;
} catch (error) {
  // Models not initialized - database connection failed
}

// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const sketchPhotoRoutes = require('./routes/sketchPhoto');
const imageRoutes = require('./routes/images');
const adminRoutes = require('./routes/admin');
const migrationRoutes = require('./routes/migrations');

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Pre-flight requests for CORS
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300, // limit each IP to 300 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (config.logging.enableConsole) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res, path) => {
    // Set proper headers for image files
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    
    // Allow cross-origin access for images
    res.setHeader('Access-Control-Allow-Origin', config.corsOrigins.join(', '));
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Remove security headers that block image display
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
    
    // Add cache control to prevent 304 responses from blocking CORS
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Maharashtra Survey Management API is running',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl,
    database: modelsInitialized ? 'connected' : 'disconnected',
    corsOrigins: config.corsOrigins
  });
});

// Debug endpoint removed for production security

// Specific route for sketch photos to ensure proper CORS headers
app.get('/uploads/sketches/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', 'sketches', filename);
  
  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigins.join(', '));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Set content type based on file extension
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (filename.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  }
  
  // Prevent caching to avoid 304 responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Remove security headers that block image display
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  
  // Send the file
  res.sendFile(filePath);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/sketch-photo', sketchPhotoRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/migrations', migrationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error.message);
  
  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: error.errors[0]?.path
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Database connection and server startup
async function startServer() {
  try {
    // Validate environment variables
    config.validate();
    // Environment validation passed

    // Test database connection
    await sequelize.authenticate();
    // Database connection established successfully

    // Sync database models (create tables if they don't exist)
    if (config.isDevelopment) {
      // Use force: false to avoid altering existing tables
      // Skip sync for now due to enum type conflict
      // Skipping database sync due to enum type conflict
      // await sequelize.sync({ force: false });
      // Database models synchronized (no alterations)
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.environment.toUpperCase()}`);
      console.log(`API Base URL: ${config.apiBaseUrl}`);
    });

  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  // SIGTERM received, shutting down gracefully
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  // SIGINT received, shutting down gracefully
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer(); 