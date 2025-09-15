/**
 * Geocoding Routes
 * 
 * Handles reverse geocoding requests from frontend
 * Proxies requests to Nominatim OpenStreetMap API to avoid CORS issues
 */

const express = require('express');
const router = express.Router();
const GeocodingService = require('../services/geocodingService');
const { authenticateToken } = require('../middleware/auth');

// Initialize geocoding service
const geocodingService = new GeocodingService();

/**
 * GET /api/geocoding/reverse
 * Reverse geocoding: Convert coordinates to address
 * 
 * Query Parameters:
 * - lat: Latitude (required)
 * - lng: Longitude (required)
 * - zoom: Zoom level (optional, default: 18)
 * 
 * Response:
 * - success: boolean
 * - data: Address data from Nominatim
 * - message: Error message if failed
 */
router.get('/reverse', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, zoom } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Parse and validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const zoomLevel = zoom ? parseInt(zoom) : 18;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values'
      });
    }

    if (isNaN(zoomLevel) || zoomLevel < 14 || zoomLevel > 18) {
      return res.status(400).json({
        success: false,
        message: 'Zoom level must be between 14 and 18'
      });
    }

    console.log(`🌍 Geocoding request from user ${req.user.email}: ${latitude}, ${longitude}`);

    // Call Nominatim API through our service
    const addressData = await geocodingService.reverseGeocode(latitude, longitude, zoomLevel);

    // Parse and structure the response
    const structuredData = geocodingService.parseAddressData(addressData);

    res.json({
      success: true,
      data: structuredData,
      message: 'Address lookup successful'
    });

  } catch (error) {
    console.error('❌ Geocoding route error:', error.message);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Geocoding service temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/geocoding/health
 * Health check for geocoding service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Geocoding service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
