import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  User, 
  Property, 
  DashboardStats, 
  LoginCredentials,
  PropertyFilters,
  PaginationParams 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
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

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await apiClient.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await apiClient.put('/auth/change-password', data);
    return response.data;
  },
};

// Properties API
export const propertiesApi = {
  getDashboardStats: async (): Promise<ApiResponse<{ stats: DashboardStats }>> => {
    const response: AxiosResponse<ApiResponse<{ stats: DashboardStats }>> = await apiClient.get('/properties/dashboard/stats');
    return response.data;
  },

  getProperties: async (filters?: PropertyFilters & PaginationParams): Promise<ApiResponse<{
    properties: Property[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_records: number;
      per_page: number;
    };
  }>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/properties?${params.toString()}`);
    return response.data;
  },

  getProperty: async (id: string): Promise<ApiResponse<{ property: Property }>> => {
    const response: AxiosResponse<ApiResponse<{ property: Property }>> = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (data: Partial<Property>): Promise<ApiResponse<{ property: Property }>> => {
    const response: AxiosResponse<ApiResponse<{ property: Property }>> = await apiClient.post('/properties', data);
    return response.data;
  },

  updateProperty: async (id: string, data: Partial<Property>): Promise<ApiResponse<{ property: Property }>> => {
    const response: AxiosResponse<ApiResponse<{ property: Property }>> = await apiClient.put(`/properties/${id}`, data);
    return response.data;
  },

  submitProperty: async (id: string): Promise<ApiResponse<{ property: Property }>> => {
    const response: AxiosResponse<ApiResponse<{ property: Property }>> = await apiClient.patch(`/properties/${id}/submit`);
    return response.data;
  },

  reviewProperty: async (id: string, action: 'approve' | 'reject', remarks?: string): Promise<ApiResponse<{ property: Property }>> => {
    const response: AxiosResponse<ApiResponse<{ property: Property }>> = await apiClient.patch(`/properties/${id}/review`, {
      action,
      remarks,
    });
    return response.data;
  },
};

export default apiClient; 