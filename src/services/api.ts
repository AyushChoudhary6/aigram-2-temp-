import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/storage';
import { API_CONFIG, AUTH_CONFIG, HTTP_STATUS, ERROR_MESSAGES, DEBUG_CONFIG } from '../constants';
import { ApiResponse, ApiError, AuthTokens } from '../types';

class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add access token to requests
        const accessToken = await this.getAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Debug logging
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        if (DEBUG_CONFIG.API_CALLS) {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('✅ API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (DEBUG_CONFIG.API_CALLS) {
          console.error('❌ API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Handle token refresh for 401 errors
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
          // Check if user is guest or registered
          const isGuest = await AsyncStorage.getItem(AUTH_CONFIG.GUEST_TOKEN_KEY);
          const hasRefreshToken = await this.getRefreshToken();
          
          // If guest user or no refresh token, don't try to refresh
          if (isGuest && !hasRefreshToken) {
            const errorMessage = error.response?.data?.message || 'Authorization failed. Please login or continue as guest.';
            return Promise.reject(this.handleApiError(error));
          }
          
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearAuthData();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private handleApiError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.UNAUTHORIZED,
            data: null,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
            statusCode: status,
          };
        case HTTP_STATUS.FORBIDDEN:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.FORBIDDEN,
            data: null,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
            statusCode: status,
          };
        case HTTP_STATUS.NOT_FOUND:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.NOT_FOUND,
            data: null,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
            statusCode: status,
          };
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.RATE_LIMITED,
            data: null,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
            statusCode: status,
          };
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.SERVER_ERROR,
            data: null,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
            statusCode: status,
          };
        default:
          return {
            success: false,
            message: data?.message || `HTTP Error ${status}`,
            data: null,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
            statusCode: status,
          };
      }
    } else if (error.request) {
      // Network error
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: null,
        timestamp: new Date().toISOString(),
        path: error.config?.url || '',
      };
    } else {
      // Other error
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
        data: null,
        timestamp: new Date().toISOString(),
        path: error.config?.url || '',
      };
    }
  }

  // Token management methods
  private async getAccessToken(): Promise<string | null> {
    try {
      // Try to get access token (for registered users)
      let token = await secureStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
      if (token) {
        return token;
      }
      
      // Fallback to guest token if no access token
      token = await AsyncStorage.getItem(AUTH_CONFIG.GUEST_TOKEN_KEY);
      if (token) {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('📱 Using guest token for API call');
        }
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  private async setTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        secureStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, tokens.accessToken),
        secureStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refreshToken),
      ]);
    } catch (error) {
      console.error('Error setting tokens:', error);
      throw error;
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        secureStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY),
        secureStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_CONFIG.USER_DATA_KEY),
        AsyncStorage.removeItem(AUTH_CONFIG.GUEST_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { timeout: API_CONFIG.TIMEOUT }
      );

      const { data } = response.data;
      await this.setTokens(data);
      return data.accessToken;
    } catch (error) {
      throw error;
    }
  }

  // Generic API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  // Public API methods (without authentication)
  async publicGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const publicConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    };
    
    const response: AxiosResponse<ApiResponse<T>> = await axios.get(
      `${API_CONFIG.BASE_URL}${url}`,
      publicConfig
    );
    return response.data;
  }

  async publicPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const publicConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      timeout: API_CONFIG.TIMEOUT,
    };

    if (DEBUG_CONFIG.API_CALLS) {
      console.log('🚀 Public API Request:', {
        method: 'POST',
        url: `${API_CONFIG.BASE_URL}${url}`,
        headers: publicConfig.headers,
        data: data,
      });
    }
    
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axios.post(
        `${API_CONFIG.BASE_URL}${url}`,
        data,
        publicConfig
      );

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✅ Public API Response:', {
          status: response.status,
          url: url,
          data: response.data,
        });
      }

      return response.data;
    } catch (error: any) {
      if (DEBUG_CONFIG.API_CALLS) {
        console.error('❌ Public API Error:', {
          status: error.response?.status,
          url: url,
          message: error.message,
          data: error.response?.data,
        });
      }
      throw this.handleApiError(error);
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  // File upload method
  async uploadFile<T = any>(
    url: string,
    file: any,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    };

    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(url, formData, config);
    return response.data;
  }

  // Form data upload method
  async postFormData<T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const formDataConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    };

    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(url, formData, formDataConfig);
    return response.data;
  }

  // Retry mechanism for failed requests
  async retryRequest<T = any>(
    requestFn: () => Promise<ApiResponse<T>>,
    maxRetries: number = API_CONFIG.MAX_RETRY_ATTEMPTS,
    delay: number = API_CONFIG.RETRY_DELAY
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry on certain error types
        if ((error as ApiError).statusCode === HTTP_STATUS.UNAUTHORIZED || 
            (error as ApiError).statusCode === HTTP_STATUS.FORBIDDEN ||
            (error as ApiError).statusCode === HTTP_STATUS.NOT_FOUND) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }

  // Batch requests
  async batchRequests<T = any>(requests: Array<() => Promise<ApiResponse<T>>>): Promise<Array<ApiResponse<T> | ApiError>> {
    const results = await Promise.allSettled(requests.map(request => request()));
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return this.handleApiError(result.reason);
      }
    });
  }

  // URL parameter replacement helper
  replaceUrlParams(url: string, params: Record<string, string | number>): string {
    let replacedUrl = url;
    Object.keys(params).forEach(key => {
      replacedUrl = replacedUrl.replace(`{${key}}`, String(params[key]));
    });
    return replacedUrl;
  }

  // Query string builder
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Public method to manually set tokens (for login/register)
  async setAuthTokens(tokens: AuthTokens): Promise<void> {
    await this.setTokens(tokens);
  }

  // Public method to clear auth data (for logout)
  async clearAuth(): Promise<void> {
    await this.clearAuthData();
  }

  // Public method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }

  // Public method to get current access token
  async getCurrentAccessToken(): Promise<string | null> {
    return await this.getAccessToken();
  }

  // Method to validate current token
  async validateCurrentToken(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const response = await this.post('/auth/validate-token', { token: accessToken });
      return response.data?.isValid || false;
    } catch (error) {
      return false;
    }
  }

  // Get base URL for constructing full URLs
  getBaseUrl(): string {
    return API_CONFIG.BASE_URL;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
