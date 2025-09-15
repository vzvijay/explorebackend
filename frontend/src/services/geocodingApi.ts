/**
 * Geocoding API Service
 * 
 * Handles reverse geocoding requests through our backend proxy
 * This avoids CORS issues by routing requests through our server
 */

import api from './api';

export interface AddressData {
  display_name: string;
  address: {
    street_number: string;
    street_name: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    ward_number: string;
    area: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface GeocodingResponse {
  success: boolean;
  data: AddressData;
  message: string;
}

export interface GeocodingError {
  success: false;
  message: string;
  error?: string;
}

class GeocodingApiService {
  /**
   * Reverse geocoding: Convert coordinates to address
   * @param lat - Latitude
   * @param lng - Longitude
   * @param zoom - Zoom level (14-18, default: 18)
   * @returns Promise with address data
   */
  async reverseGeocode(
    lat: number, 
    lng: number, 
    zoom: number = 18
  ): Promise<GeocodingResponse> {
    try {
      console.log(`🌍 Frontend geocoding request: ${lat}, ${lng} (zoom: ${zoom})`);

      const response = await api.get('/geocoding/reverse', {
        params: {
          lat: lat.toString(),
          lng: lng.toString(),
          zoom: zoom.toString()
        }
      });

      if (response.data.success) {
        console.log(`✅ Frontend geocoding successful: ${response.data.data.display_name}`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Geocoding failed');
      }

    } catch (error: any) {
      console.error('❌ Frontend geocoding error:', error.message);
      
      // Handle different error types
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Geocoding service temporarily unavailable');
      }
    }
  }

  /**
   * Health check for geocoding service
   * @returns Promise with health status
   */
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.get('/geocoding/health');
      return response.data;
    } catch (error: any) {
      console.error('❌ Geocoding health check failed:', error.message);
      throw new Error('Geocoding service health check failed');
    }
  }

  /**
   * Parse address data for form fields
   * @param addressData - Raw address data from geocoding service
   * @returns Formatted address data for survey form
   */
  parseAddressForForm(addressData: AddressData) {
    const { address } = addressData;
    
    // Create street address
    const streetAddress = address.street_number && address.street_name 
      ? `${address.street_number}, ${address.street_name}`
      : address.street_name || address.neighborhood || '';

    return {
      address: addressData.display_name,
      street_address: streetAddress,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code,
      ward_number_from_gps: address.ward_number,
      area_from_gps: address.area
    };
  }
}

export default new GeocodingApiService();
