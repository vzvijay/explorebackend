/**
 * Geocoding Service
 * 
 * Handles reverse geocoding (coordinates to address) using Nominatim OpenStreetMap API
 * This service runs on the backend to avoid CORS issues from frontend
 */

class GeocodingService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'MaharashtraSurveyApp/1.0';
    this.requestTimeout = 10000; // 10 seconds
  }

  /**
   * Reverse geocoding: Convert coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level (14-18)
   * @returns {Promise<Object>} Address data from Nominatim
   */
  async reverseGeocode(lat, lng, zoom = 18) {
    try {
      // Validate coordinates
      if (!this.isValidCoordinate(lat, lng)) {
        throw new Error('Invalid coordinates provided');
      }

      const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=en`;
      
      console.log(`🌍 Geocoding request: ${lat}, ${lng} (zoom: ${zoom})`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: this.requestTimeout
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.display_name) {
        throw new Error('No address data returned from Nominatim');
      }

      console.log(`✅ Geocoding successful: ${data.display_name}`);
      return data;

    } catch (error) {
      console.error('❌ Geocoding error:', error.message);
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  /**
   * Validate coordinate values
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if valid coordinates
   */
  isValidCoordinate(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      !isNaN(lat) && 
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  /**
   * Parse address data into structured format
   * @param {Object} data - Raw data from Nominatim
   * @returns {Object} Structured address data
   */
  parseAddressData(data) {
    const addressParts = data.address || {};
    
    return {
      display_name: data.display_name,
      address: {
        street_number: addressParts.house_number || '',
        street_name: addressParts.road || addressParts.street || '',
        neighborhood: addressParts.neighbourhood || addressParts.suburb || '',
        city: addressParts.city || addressParts.town || addressParts.village || 
              addressParts.municipality || addressParts.county || '',
        state: addressParts.state || addressParts.province || addressParts.region || '',
        country: addressParts.county || '',
        postal_code: addressParts.postcode || '',
        ward_number: addressParts['addr:postcode'] || addressParts.postcode || '',
        area: addressParts.neighbourhood || addressParts.residential || ''
      },
      coordinates: {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon)
      }
    };
  }
}

module.exports = GeocodingService;
