import api from './api';

export interface PendingApproval {
  id: string;
  survey_number: string;
  owner_name: string;
  locality: string;
  zone: string;
  property_type: string;
  survey_status: string;
  approval_status: string;
  survey_date: string;
  surveyed_by: string;
  sketch_photo: string | null; // Legacy file path support
  sketch_photo_base64?: string | null; // Base64 encoded image data
  sketch_photo_size?: number | null; // File size in bytes
  sketch_photo_type?: string | null; // MIME type
  sketch_photo_captured_at: string | null;
  surveyor: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    role: string;
  };
}

export interface ApprovalStats {
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    approval_rate: string;
  };
  zone_distribution: Array<{
    zone: string;
    approval_status: string;
    count: string;
  }>;
  type_distribution: Array<{
    property_type: string;
    approval_status: string;
    count: string;
  }>;
}

export interface PendingApprovalsResponse {
  success: boolean;
  data: {
    properties: PendingApproval[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_prev: boolean;
      limit: number;
    };
  };
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data: {
    property_id: string;
    survey_number: string;
    approved_by?: string;
    approved_at?: string;
    rejected_by?: string;
    rejected_at?: string;
    rejection_reason?: string;
    admin_notes?: string;
  };
}

export interface PropertyForApproval {
  id: string;
  survey_number: string;
  owner_name: string;
  locality: string;
  zone: string;
  property_type: string;
  survey_status: string;
  approval_status: string;
  survey_date: string;
  surveyed_by: string;
  sketch_photo: string | null; // Legacy file path support
  sketch_photo_base64?: string | null; // Base64 encoded image data
  sketch_photo_size?: number | null; // File size in bytes
  sketch_photo_type?: string | null; // MIME type
  sketch_photo_captured_at: string | null;
  surveyor: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    employee_id: string;
    department?: string;
  };
  // Add other property fields as needed
}

export interface PropertyForApprovalResponse {
  success: boolean;
  data: {
    property: PropertyForApproval;
  };
}

class AdminApiService {
  // Get pending approvals with filtering and pagination
  async getPendingApprovals(params: {
    zone?: string;
    property_type?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PendingApprovalsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.zone) queryParams.append('zone', params.zone);
    if (params.property_type) queryParams.append('property_type', params.property_type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const response = await api.get(`/admin/pending-approvals?${queryParams.toString()}`);
    return response.data;
  }

  // Get approval statistics
  async getApprovalStats(params: {
    zone?: string;
    property_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApprovalStats> {
    const queryParams = new URLSearchParams();
    
    if (params.zone) queryParams.append('zone', params.zone);
    if (params.property_type) queryParams.append('property_type', params.property_type);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);

    const response = await api.get(`/admin/approval-stats?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get property details for approval review
  async getPropertyForApproval(propertyId: string): Promise<PropertyForApprovalResponse> {
    const response = await api.get(`/admin/property/${propertyId}`);
    return response.data;
  }

  // Approve a property survey
  async approveProperty(propertyId: string, adminNotes?: string): Promise<ApprovalResponse> {
    const response = await api.post(`/admin/approve/${propertyId}`, {
      admin_notes: adminNotes
    });
    return response.data;
  }

  // Reject a property survey
  async rejectProperty(propertyId: string, rejectionReason: string, adminNotes?: string): Promise<ApprovalResponse> {
    const response = await api.post(`/admin/reject/${propertyId}`, {
      rejection_reason: rejectionReason,
      admin_notes: adminNotes
    });
    return response.data;
  }
}

export default new AdminApiService();
