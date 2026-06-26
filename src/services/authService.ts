import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiService } from './api';
import { API_ENDPOINTS, AUTH_CONFIG, DEBUG_CONFIG, PLATFORM } from '../constants';
import {
  AuthResponse,
  User,
  AuthTokens,
  GuestAuthRequest,
  RegisterRequest,
  LoginRequest,
  OtpRequest,
  OtpResponse,
  TokenValidationResponse,
  ApiResponse,
} from '../types';
import { phoneAuthService } from './phoneAuthService';

class AuthService {
  private currentUser: User | null = null;
  private deviceId: string | null = null;

  constructor() {
    this.initializeDeviceId();
  }

  // Initialize device ID for guest authentication
  private async initializeDeviceId(): Promise<void> {
    try {
      let deviceId = await AsyncStorage.getItem(AUTH_CONFIG.DEVICE_ID_KEY);
      
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(AUTH_CONFIG.DEVICE_ID_KEY, deviceId);
      }
      
      this.deviceId = deviceId;
      
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('🔧 Device ID initialized:', deviceId);
      }
    } catch (error) {
      console.error('Error initializing device ID:', error);
      // Fallback to a generated ID
      this.deviceId = this.generateDeviceId();
    }
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const platform = PLATFORM.IS_IOS ? 'ios' : PLATFORM.IS_ANDROID ? 'android' : 'web';
    return `${platform}_${timestamp}_${random}`;
  }

  // Authentication Methods

  /**
   * Send OTP for registration
   */
  async sendRegistrationOtp(phoneNumber: string): Promise<ApiResponse<OtpResponse>> {
    const request: OtpRequest = { phoneNumber };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('📱 Sending registration OTP for:', phoneNumber);
    }

    return await apiService.publicPost<OtpResponse>(API_ENDPOINTS.AUTH.REGISTER_SEND_OTP, request);
  }

  /**
   * Verify OTP and complete registration
   */
  async verifyRegistration(phoneNumber: string, otp: string, name: string): Promise<ApiResponse<AuthResponse>> {
    const request: RegisterRequest = { phoneNumber, otp, name };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('✅ Verifying registration for:', phoneNumber);
    }

    const response = await apiService.publicPost<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER_VERIFY, request);
    
    if (response.success && response.data) {
      await this.handleSuccessfulAuth(response.data);
    }
    
    return response;
  }

  /**
   * Send OTP for login
   */
  async sendLoginOtp(phoneNumber: string): Promise<ApiResponse<OtpResponse>> {
    const request: OtpRequest = { phoneNumber };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('📱 Sending login OTP for:', phoneNumber);
    }

    return await apiService.publicPost<OtpResponse>(API_ENDPOINTS.AUTH.LOGIN_SEND_OTP, request);
  }

  /**
   * Verify OTP and complete login
   */
  async verifyLogin(phoneNumber: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    const request: LoginRequest = { phoneNumber, otp };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('✅ Verifying login for:', phoneNumber);
    }

    const response = await apiService.publicPost<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN_VERIFY, request);
    
    if (response.success && response.data) {
      await this.handleSuccessfulAuth(response.data);
    }
    
    return response;
  }

  /**
   * Login with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const request = { email, password };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('✅ Logging in with email:', email);
    }

    const response = await apiService.publicPost<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN_EMAIL, request);
    
    if (response.success && response.data) {
      await this.handleSuccessfulAuth(response.data);
    }
    
    return response;
  }

  /**
   * Register with email and password
   */
  async registerWithEmail(name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const request = { name, email, password };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('✅ Registering with email:', email);
    }

    const response = await apiService.publicPost<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER_EMAIL, request);
    
    if (response.success && response.data) {
      await this.handleSuccessfulAuth(response.data);
    }
    
    return response;
  }

  // ==================== Firebase Phone OTP Authentication ====================

  /**
   * Send Firebase OTP to phone number
   */
  async sendFirebasePhoneOtp(phoneNumber: string): Promise<ApiResponse<OtpResponse>> {
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('📱 Sending Firebase OTP to:', phoneNumber);
    }

    try {
      const result = await phoneAuthService.sendOtp(phoneNumber);

      if (result.success) {
        const response: ApiResponse<OtpResponse> = {
          success: true,
          message: result.message,
          data: {
            phoneNumber: phoneNumber,
            message: 'OTP sent successfully via Firebase',
            expiryTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            otpLength: 6,
          },
        };
        return response;
      } else {
        return {
          success: false,
          message: result.message,
          data: {
            phoneNumber: phoneNumber,
            message: result.message,
            expiryTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            otpLength: 6,
          },
        };
      }
    } catch (error: any) {
      console.error('Error sending Firebase phone OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
        data: {
          phoneNumber: phoneNumber,
          message: error.message || 'Failed to send OTP',
          expiryTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          otpLength: 6,
        },
      };
    }
  }

  /**
   * Verify Firebase OTP
   */
  async verifyFirebasePhoneOtp(otp: string): Promise<ApiResponse<AuthResponse>> {
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('✅ Verifying Firebase OTP');
    }

    try {
      const result = await phoneAuthService.verifyOtp(otp);

      if (result.success && result.userId) {
        // Create auth response with Firebase UID
        const firebaseUser = phoneAuthService.getCurrentUser();
        const phoneNumber = firebaseUser?.phoneNumber || '';
        
        const authResponse: AuthResponse = {
          userId: result.userId,
          name: firebaseUser?.displayName || 'User',
          phoneNumber: phoneNumber,
          role: 'REGISTERED',
          createdAt: new Date().toISOString(),
          accessToken: `firebase_${result.userId}_${Date.now()}`,
          refreshToken: `firebase_refresh_${result.userId}_${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        await this.handleSuccessfulAuth(authResponse);

        return {
          success: true,
          message: result.message,
          data: authResponse,
        };
      } else {
        return {
          success: false,
          message: result.message,
          data: {} as AuthResponse,
        };
      }
    } catch (error: any) {
      console.error('Error verifying Firebase phone OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
        data: {} as AuthResponse,
      };
    }
  }

  /**
   * Register with Firebase phone OTP
   */
  async registerWithFirebasePhone(phoneNumber: string, otp: string, name: string): Promise<ApiResponse<AuthResponse>> {
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('📱 Registering with Firebase phone:', phoneNumber);
    }

    try {
      // First verify the OTP
      const verifyResult = await this.verifyFirebasePhoneOtp(otp);

      if (verifyResult.success && verifyResult.data) {
        // Update user name if provided
        const firebaseUser = phoneAuthService.getCurrentUser();
        if (firebaseUser && name) {
          const updatedAuth = {
            ...verifyResult.data,
            name: name,
          };
          await this.handleSuccessfulAuth(updatedAuth);

          return {
            success: true,
            message: 'Registration successful via Firebase',
            data: updatedAuth,
          };
        }

        return verifyResult;
      } else {
        return verifyResult;
      }
    } catch (error: any) {
      console.error('Error registering with Firebase phone:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
        data: {} as AuthResponse,
      };
    }
  }

  /**
   * Login with Firebase phone OTP
   */
  async loginWithFirebasePhone(phoneNumber: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('📱 Logging in with Firebase phone:', phoneNumber);
    }

    try {
      const result = await this.verifyFirebasePhoneOtp(otp);
      return result;
    } catch (error: any) {
      console.error('Error logging in with Firebase phone:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
        data: {} as AuthResponse,
      };
    }
  }

  /**
   * Check if Firebase user is authenticated
   */
  isFirebaseAuthenticated(): boolean {
    return phoneAuthService.isAuthenticated();
  }

  /**
   * Sign out from Firebase
   */
  async signOutFromFirebase(): Promise<void> {
    try {
      await phoneAuthService.signOut();
      await this.clearAuthData();
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('✅ Signed out from Firebase');
      }
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
      throw error;
    }
  }

  // ==================== End Firebase Phone OTP Authentication ====================

  /**
   * Authenticate as guest user
   */
  async authenticateAsGuest(): Promise<ApiResponse<AuthResponse>> {
    if (!this.deviceId) {
      await this.initializeDeviceId();
    }

    const platform = PLATFORM.IS_IOS ? 'IOS' : PLATFORM.IS_ANDROID ? 'ANDROID' : 'WEB';
    const request: GuestAuthRequest = {
      deviceId: this.deviceId,
      platform,
    };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('👤 Authenticating as guest on platform:', platform, 'Device ID:', this.deviceId);
    }
    
    try {
      // Try real API call first
      const response = await apiService.publicPost<AuthResponse>(
        API_ENDPOINTS.AUTH.GUEST_AUTH, 
        request
      );
      
      if (response.success && response.data) {
        await this.handleSuccessfulAuth(response.data);
        await AsyncStorage.setItem(AUTH_CONFIG.GUEST_TOKEN_KEY, response.data.accessToken);
        if (DEBUG_CONFIG.AUTHENTICATION) {
          console.log('✅ Guest authentication successful via API');
        }
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('Guest auth API failed, falling back to dummy:', error);
      
      // Fallback to dummy for testing if API fails
      const dummyAuthResponse: AuthResponse = {
        userId: `guest_${Date.now()}`,
        name: 'Guest User',
        phoneNumber: '0000000000',
        role: 'GUEST',
        createdAt: new Date().toISOString(),
        accessToken: `dummy_guest_token_${Date.now()}`,
        refreshToken: `dummy_guest_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Guest authentication successful (fallback)',
        data: dummyAuthResponse,
      };
      
      await this.handleSuccessfulAuth(dummyAuthResponse);
      await AsyncStorage.setItem(AUTH_CONFIG.GUEST_TOKEN_KEY, dummyAuthResponse.accessToken);
      
      return response;
    }
  }

  /**
   * Upgrade guest user to registered user
   */
  async upgradeGuestUser(phoneNumber: string, otp: string, name: string): Promise<ApiResponse<AuthResponse>> {
    const request = { phoneNumber, otp, name };
    
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('⬆️ Upgrading guest user:', phoneNumber);
    }

    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.GUEST_UPGRADE, request);
    
    if (response.success && response.data) {
      await this.handleSuccessfulAuth(response.data);
      // Remove guest token
      await AsyncStorage.removeItem(AUTH_CONFIG.GUEST_TOKEN_KEY);
    }
    
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    if (DEBUG_CONFIG.AUTHENTICATION) {
      console.log('🔄 Refreshing access token');
    }

    return await apiService.post<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
  }

  /**
   * Validate current token
   */
  async validateToken(token?: string): Promise<ApiResponse<TokenValidationResponse>> {
    const tokenToValidate = token || await apiService.getCurrentAccessToken();
    
    if (!tokenToValidate) {
      return {
        success: false,
        message: 'No token available',
        data: { isValid: false },
      };
    }

    return await apiService.post<TokenValidationResponse>(API_ENDPOINTS.AUTH.VALIDATE_TOKEN, {
      token: tokenToValidate,
    });
  }

  /**
   * Logout user
   */
  async logout(deviceId?: string, allDevices: boolean = false): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('👋 Logging out user');
      }

      const logoutData = {
        deviceId: deviceId || this.deviceId,
        reason: 'USER_INITIATED',
        allDevices,
      };

      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGOUT, logoutData);
      
      // Clear local auth data regardless of API response
      await this.clearAuthData();
      
      return response;
    } catch (error) {
      // Even if logout API fails, clear local data
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Simple logout (just clear tokens)
   */
  async simpleLogout(): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('👋 Simple logout');
      }

      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGOUT_SIMPLE);
      
      // Clear local auth data
      await this.clearAuthData();
      
      return response;
    } catch (error) {
      // Even if logout API fails, clear local data
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Guest logout
   */
  async guestLogout(): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('👋 Guest logout');
      }

      const response = await apiService.post(API_ENDPOINTS.AUTH.GUEST_LOGOUT);
      
      // Clear local auth data
      await this.clearAuthData();
      
      return response;
    } catch (error) {
      // Even if logout API fails, clear local data
      await this.clearAuthData();
      throw error;
    }
  }

  // User Management Methods

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await apiService.getCurrentAccessToken();
      if (!accessToken) {
        return false;
      }

      // Validate token with backend
      const validation = await this.validateToken(accessToken);
      return validation.success && validation.data.isValid;
    } catch (error) {
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.error('Error checking authentication:', error);
      }
      return false;
    }
  }

  /**
   * Check if current user is guest
   */
  isGuestUser(): boolean {
    return this.currentUser?.role === 'GUEST';
  }

  /**
   * Check if current user is admin
   */
  isAdminUser(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  /**
   * Check if current user is registered
   */
  isRegisteredUser(): boolean {
    return this.currentUser?.role === 'REGISTERED';
  }

  /**
   * Get device ID
   */
  getDeviceId(): string | null {
    return this.deviceId;
  }

  // Storage Methods

  /**
   * Handle successful authentication
   */
  private async handleSuccessfulAuth(authData: AuthResponse): Promise<void> {
    try {
      // Extract user data and tokens
      const { accessToken, refreshToken, expiresAt, ...userData } = authData;
      
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt,
      };

      // Store tokens securely
      await apiService.setAuthTokens(tokens);
      
      // Store user data
      await AsyncStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(userData));
      
      // Update current user
      this.currentUser = userData;
      
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('✅ Authentication successful for user:', userData.userId);
      }
    } catch (error) {
      console.error('Error handling successful auth:', error);
      throw error;
    }
  }

  /**
   * Load user data from storage
   */
  async loadUserFromStorage(): Promise<User | null> {
    try {
      const userDataString = await AsyncStorage.getItem(AUTH_CONFIG.USER_DATA_KEY);
      
      if (userDataString) {
        const userData: User = JSON.parse(userDataString);
        this.currentUser = userData;
        
        if (DEBUG_CONFIG.AUTHENTICATION) {
          console.log('📱 Loaded user from storage:', userData.userId);
        }
        
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await apiService.clearAuth();
      this.currentUser = null;
      
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('🧹 Cleared all auth data');
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Initialize authentication state on app start
   */
  async initializeAuth(): Promise<User | null> {
    try {
      if (DEBUG_CONFIG.AUTHENTICATION) {
        console.log('🚀 Initializing authentication');
      }

      // Load user from storage
      const user = await this.loadUserFromStorage();
      
      if (user) {
        // Check if token is still valid
        const isValid = await this.isAuthenticated();
        
        if (isValid) {
          if (DEBUG_CONFIG.AUTHENTICATION) {
            console.log('✅ User session is valid');
          }
          return user;
        } else {
          if (DEBUG_CONFIG.AUTHENTICATION) {
            console.log('❌ User session expired, clearing data');
          }
          await this.clearAuthData();
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error initializing auth:', error);
      await this.clearAuthData();
      return null;
    }
  }

  // OTP Validation Methods

  /**
   * Send generic OTP
   */
  async sendOtp(phoneNumber: string): Promise<ApiResponse<OtpResponse>> {
    const request: OtpRequest = { phoneNumber };
    return await apiService.post<OtpResponse>('/validation/send-otp', request);
  }

  /**
   * Verify generic OTP
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<ApiResponse<any>> {
    const request = { phoneNumber, otp };
    return await apiService.post('/validation/verify-otp', request);
  }

  /**
   * Validate phone number
   */
  async validatePhoneNumber(phoneNumber: string): Promise<ApiResponse<any>> {
    const request = { phoneNumber };
    return await apiService.post('/validation/validate-phone', request);
  }

  /**
   * Get OTP status
   */
  async getOtpStatus(phoneNumber: string): Promise<ApiResponse<any>> {
    return await apiService.get(`/validation/otp-status/${phoneNumber}`);
  }

  /**
   * Resend OTP
   */
  async resendOtp(phoneNumber: string): Promise<ApiResponse<OtpResponse>> {
    const request: OtpRequest = { phoneNumber };

    return await apiService.post<OtpResponse>('/validation/resend-otp', request);
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
