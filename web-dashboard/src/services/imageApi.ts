import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance for image uploads
const imageApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for image uploads
});

// Request interceptor to add auth token
imageApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
imageApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Image upload result interface
export interface ImageUploadResult {
  id: string;
  image_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

// Image API service
export const imageApi = {
  /**
   * Upload image to backend (which uploads to GitLab)
   * @param file - Image file to upload
   * @param propertyId - Property ID
   * @param imageType - Type of image (owner_photo, signature, sketch_photo)
   * @param onProgress - Optional progress callback
   * @returns Promise with upload result
   */
  uploadImage: async (
    file: File, 
    propertyId: string, 
    imageType: 'owner_photo' | 'signature' | 'sketch_photo',
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ image: ImageUploadResult }>> => {
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    formData.append('propertyId', propertyId);
    formData.append('imageType', imageType);

    console.log(`📤 Uploading ${imageType} for property ${propertyId}:`, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });

    const response: AxiosResponse<ApiResponse<{ image: ImageUploadResult }>> = 
      await imageApiClient.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

    console.log(`✅ Image uploaded successfully:`, response.data.data.image);
    return response.data;
  },

  /**
   * Get image URL for display
   * @param imageId - Image ID
   * @returns Promise with image URL
   */
  getImageUrl: async (imageId: string): Promise<string> => {
    const response = await imageApiClient.get(`/images/${imageId}/url`);
    return `${API_BASE_URL}/images/${imageId}`;
  },

  /**
   * Get all images for a property
   * @param propertyId - Property ID
   * @returns Promise with image list
   */
  getPropertyImages: async (propertyId: string): Promise<ApiResponse<{ images: ImageUploadResult[] }>> => {
    const response: AxiosResponse<ApiResponse<{ images: ImageUploadResult[] }>> = 
      await imageApiClient.get(`/images/property/${propertyId}`);
    return response.data;
  },

  /**
   * Delete image
   * @param imageId - Image ID
   * @returns Promise with deletion result
   */
  deleteImage: async (imageId: string): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = 
      await imageApiClient.delete(`/images/${imageId}`);
    return response.data;
  },

  /**
   * Generate image URL for display
   * @param imageId - Image ID
   * @returns Image URL string
   */
  generateImageUrl: (imageId: string): string => {
    return `${API_BASE_URL}/images/${imageId}`;
  }
};

export default imageApi;
