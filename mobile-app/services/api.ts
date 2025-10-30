import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '@/constants/radio';
import CacheService from './cache';
import { Alert } from 'react-native';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('adminToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as any;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('adminToken');
      await AsyncStorage.removeItem('adminUser');
      // Navigate to login screen would be handled by the component
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      });
    }
    
    // Handle server errors
    const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic retry wrapper
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Don't retry on authentication errors or 4xx errors
      if (error.status === 401 || (error.status >= 400 && error.status < 500)) {
        throw error;
      }

      // Don't retry on network errors if we've reached max retries
      if (error.isNetworkError && attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  throw lastError;
};

// Retry wrapper with caching support
const withRetryAndCache = async <T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  maxRetries: number = MAX_RETRIES,
  ttl: number | false = 5 * 60 * 1000 // Default 5 minutes
): Promise<T> => {
  // If caching is disabled (ttl === false), just use retry
  if (ttl === false) {
    return withRetry(apiCall, maxRetries);
  }

  // Try to get from cache first
  const cached = await CacheService.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, make the API call with retry
  const result = await withRetry(apiCall, maxRetries);

  // Cache the result
  await CacheService.set(cacheKey, result, ttl);

  return result;
};

// API Service class
export class ApiService {
  // Auth endpoints
  static async login(email: string, password: string) {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    }, 'auth_login', 1, false); // Don't cache auth data
  }

  static async register(email: string, password: string, role: string = 'admin') {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/auth/register', { email, password, role });
      return response.data;
    }, 'auth_register', 1, false); // Don't cache auth data
  }

  static async verifyToken() {
    return withRetryAndCache(async () => {
      const response = await apiClient.get('/auth/verify');
      return response.data;
    }, 'auth_verify', 1, false); // Don't cache auth data
  }

  static async refreshToken() {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/auth/refresh');
      return response.data;
    }, 'auth_refresh', 1, false); // Don't cache auth data
  }

  static async changePassword(currentPassword: string, newPassword: string) {
    return withRetry(async () => {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    });
  }

  // Social Links endpoints
  static async getSocialLinks() {
    return withRetryAndCache(async () => {
      const response = await apiClient.get('/social-links/admin');
      return response.data;
    }, CacheService.getCacheKeys().SOCIAL_LINKS);
  }

  static async createSocialLink(data: any) {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/social-links', data);
      return response.data;
    }, CacheService.getCacheKeys().SOCIAL_LINKS, 1, false); // Don't cache create operations
  }

  static async updateSocialLink(id: string, data: any) {
    return withRetryAndCache(async () => {
      const response = await apiClient.put(`/social-links/${id}`, data);
      return response.data;
    }, CacheService.getCacheKeys().SOCIAL_LINKS, 1, false); // Don't cache update operations
  }

  static async deleteSocialLink(id: string) {
    return withRetryAndCache(async () => {
      const response = await apiClient.delete(`/social-links/${id}`);
      return response.data;
    }, CacheService.getCacheKeys().SOCIAL_LINKS, 1, false); // Don't cache delete operations
  }

  static async reorderSocialLinks(orderedIds: string[]) {
    return withRetryAndCache(async () => {
      const response = await apiClient.put('/social-links/reorder', { orderedIds });
      return response.data;
    }, CacheService.getCacheKeys().SOCIAL_LINKS, 1, false); // Don't cache reorder operations
  }

  // Ad Banners endpoints
  static async getAdBanners() {
    return withRetryAndCache(async () => {
      const response = await apiClient.get('/ads/admin');
      return response.data;
    }, CacheService.getCacheKeys().AD_BANNERS);
  }

  static async createAdBanner(data: any) {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/ads', data);
      return response.data;
    }, CacheService.getCacheKeys().AD_BANNERS, 1, false); // Don't cache create operations
  }

  static async updateAdBanner(id: string, data: any) {
    return withRetryAndCache(async () => {
      const response = await apiClient.put(`/ads/${id}`, data);
      return response.data;
    }, CacheService.getCacheKeys().AD_BANNERS, 1, false); // Don't cache update operations
  }

  static async deleteAdBanner(id: string) {
    return withRetryAndCache(async () => {
      const response = await apiClient.delete(`/ads/${id}`);
      return response.data;
    }, CacheService.getCacheKeys().AD_BANNERS, 1, false); // Don't cache delete operations
  }

  static async uploadAdImage(imageData: FormData) {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/ads/upload', imageData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }, 'ad_image_upload', 1, false); // Don't cache upload operations
  }

  static async trackAdClick(id: string) {
    return withRetry(async () => {
      const response = await apiClient.post(`/ads/${id}/click`);
      return response.data;
    });
  }

  // Stream Metadata endpoints
  static async getStreamMetadata() {
    return withRetryAndCache(async () => {
      const response = await apiClient.get('/stream/metadata/admin');
      return response.data;
    }, CacheService.getCacheKeys().STREAM_METADATA);
  }

  static async getCurrentStreamMetadata() {
    return withRetryAndCache(async () => {
      const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/stream/metadata/current`);
      return response.data;
    }, 'current_stream_metadata', 3, 30 * 1000); // Cache for 30 seconds
  }

  static async createStreamMetadata(data: any) {
    return withRetryAndCache(async () => {
      const response = await apiClient.post('/stream/metadata', data);
      return response.data;
    }, CacheService.getCacheKeys().STREAM_METADATA, 1, false); // Don't cache create operations
  }

  static async updateStreamMetadata(id: string, data: any) {
    return withRetryAndCache(async () => {
      const response = await apiClient.put(`/stream/metadata/${id}`, data);
      return response.data;
    }, CacheService.getCacheKeys().STREAM_METADATA, 1, false); // Don't cache update operations
  }

  static async deleteStreamMetadata(id: string) {
    return withRetryAndCache(async () => {
      const response = await apiClient.delete(`/stream/metadata/${id}`);
      return response.data;
    }, CacheService.getCacheKeys().STREAM_METADATA, 1, false); // Don't cache delete operations
  }

  static async endStreamTrack(id: string) {
    return withRetryAndCache(async () => {
      const response = await apiClient.post(`/stream/metadata/${id}/end`);
      return response.data;
    }, CacheService.getCacheKeys().STREAM_METADATA, 1, false); // Don't cache end operations
  }

  // User Management endpoints
  static async getUsers() {
    return withRetry(async () => {
      const response = await apiClient.get('/auth/users');
      return response.data;
    });
  }

  static async createUser(data: any) {
    return withRetry(async () => {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    });
  }

  static async updateUser(id: string, data: any) {
    return withRetry(async () => {
      const response = await apiClient.put(`/auth/users/${id}`, data);
      return response.data;
    });
  }

  static async deleteUser(id: string) {
    return withRetry(async () => {
      const response = await apiClient.delete(`/auth/users/${id}`);
      return response.data;
    });
  }

  // Public endpoints (no auth required)
  static async getPublicSocialLinks() {
    return withRetryAndCache(async () => {
      const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/social-links`);
      return response.data;
    }, 'public_social_links', 3, 10 * 60 * 1000); // Cache for 10 minutes
  }

  static async getPublicAdBanners() {
    return withRetryAndCache(async () => {
      const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/ads`);
      return response.data;
    }, 'public_ad_banners', 3, 10 * 60 * 1000); // Cache for 10 minutes
  }

  static async getStreamMetadataHistory() {
    return withRetryAndCache(async () => {
      const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/stream/metadata/history`);
      return response.data;
    }, 'stream_metadata_history', 3, 10 * 60 * 1000); // Cache for 10 minutes
  }

  // Health check
  static async healthCheck() {
    return withRetryAndCache(async () => {
      const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/health`);
      return response.data;
    }, 'health_check', 1, 60 * 1000); // Cache for 1 minute
  }
}

// Error handling utilities
export class ApiError extends Error {
  public status?: number;
  public data?: any;
  public isNetworkError?: boolean;

  constructor(message: string, status?: number, data?: any, isNetworkError?: boolean) {
    super(message);
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

// Utility function to handle API errors in components
export const handleApiError = (error: any, showAlert: boolean = true) => {
  console.error('API Error:', error);
  
  let message = 'An unexpected error occurred';
  
  if (error instanceof ApiError) {
    message = error.message;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.data?.error) {
    message = error.data.error;
  }
  
  if (showAlert) {
    Alert.alert('Error', message);
  }
  
  return message;
};

// Cache invalidation utility
export const invalidateCache = (cacheKey: string) => {
  CacheService.remove(cacheKey);
};

// Cache invalidation for multiple keys
export const invalidateMultipleCache = (cacheKeys: string[]) => {
  cacheKeys.forEach(key => CacheService.remove(key));
};

export default ApiService;