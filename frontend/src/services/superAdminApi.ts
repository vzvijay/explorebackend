import api from './api';

/**
 * Super Admin API Service
 * 
 * This service handles super admin hard delete operations
 * 
 * IMPORTANT: This service is for LOCAL TESTING ONLY
 * DO NOT DEPLOY TO PRODUCTION
 */

export interface DeletableProperty {
  id: string;
  property_id: string;
  survey_number: string;
  owner_name: string;
  locality: string;
  zone: string;
  property_type: string;
  status: string;
  survey_date: string;
  created_at: string;
  surveyor: {
    name: string;
    email: string;
    role: string;
  } | null;
  image_count: number;
  has_images: boolean;
}

export interface DeletablePropertiesResponse {
  success: boolean;
  data: {
    properties: DeletableProperty[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface HardDeleteResponse {
  success: boolean;
  message: string;
  data: {
    property_id: string;
    survey_number: string;
    owner_name: string;
    deleted_by: string;
    deleted_at: string;
    images_deleted: number;
    gitlab_deletion: {
      total: number;
      successful: number;
      failed: number;
      errors: Array<{
        filePath: string;
        error: string;
      }>;
    };
  };
}

class SuperAdminApiService {
  /**
   * Get properties that can be hard deleted
   */
  async getDeletableProperties(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<DeletablePropertiesResponse> {
    const response = await api.get('/super-admin/properties', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || ''
      }
    });
    return response.data;
  }

  /**
   * Hard delete a property (permanent deletion)
   */
  async hardDeleteProperty(propertyId: string): Promise<HardDeleteResponse> {
    const response = await api.delete(`/super-admin/property/${propertyId}`);
    return response.data;
  }
}

export default new SuperAdminApiService();
