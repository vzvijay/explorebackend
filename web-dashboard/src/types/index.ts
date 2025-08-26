// User types
export interface User {
  id: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'municipal_officer' | 'engineer' | 'field_executive';
  created_at?: string;
  updated_at?: string;
}

// Room details for property use
export interface RoomDetail {
  id: string;
  length: number;
  width: number;
  area: number;
}

export interface PropertyUseDetails {
  halls: RoomDetail[];
  bedrooms: RoomDetail[];
  kitchens: RoomDetail[];
  shops: RoomDetail[];
  bathrooms: RoomDetail[];
}

// Property types
export interface Property {
  id: string;
  // Survey Identification
  survey_number: string;
  old_mc_property_number?: string;
  register_no?: string;
  
  // Owner Information
  owner_name: string;
  owner_father_name?: string;
  owner_phone?: string;
  owner_email?: string;
  aadhar_number?: string;
  
  // Property Address
  house_number?: string;
  street_name?: string;
  locality: string;
  ward_number: number;
  pincode: string;
  
  // Property Details
  property_type: 'residential' | 'commercial' | 'industrial' | 'mixed' | 'institutional';
  construction_type?: 'rcc' | 'load_bearing' | 'tin_patra' | 'kaccha';
  construction_year?: number | null;
  number_of_floors: number;
  
  // Building Permission
  building_permission: boolean;
  bp_number?: string;
  bp_date?: string;
  
  // Area Measurements
  plot_area: number;
  built_up_area: number;
  carpet_area: number;
  
  // Property Use Details
  property_use_details?: PropertyUseDetails;
  
  // Utility Connections
  water_connection?: number; // 1, 2, or 3
  water_connection_number?: string;
  water_connection_date?: string;
  electricity_connection: boolean;
  electricity_connection_number?: string;
  sewage_connection: boolean;
  solar_panel: boolean;
  rain_water_harvesting: boolean;
  
  // Location
  latitude?: number;
  longitude?: number;
  
  // Photos and Signatures
  owner_tenant_photo?: string | null;
  signature_data?: string | null;
  
  // Tax Assessment
  assessment_year?: number;
  estimated_tax?: number;
  
  // Survey Status
  survey_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  
  // Additional Information
  remarks?: string;
  
  // Survey Metadata
  surveyed_by: string;
  reviewed_by?: string;
  review_remarks?: string;
  survey_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

// Dashboard types
export interface DashboardStats {
  total_properties: number;
  pending_review: number;
  approved: number;
  rejected: number;
  draft: number;
  total_tax_revenue: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_records: number;
  per_page: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PropertyFilters {
  survey_status?: string;
  property_type?: string;
  ward_number?: number;
  construction_type?: string;
  building_permission?: boolean;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
} 