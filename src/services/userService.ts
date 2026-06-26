import { apiService } from './api';
import { 
  ApiResponse, 
  User, 
  UpdateProfileRequest, 
  Wallet, 
  WalletTransaction, 
  CreatorDashboard, 
  ViewerDashboard,
  PaginatedResponse 
} from '../types';

class UserService {
  private readonly BASE_PATH = '/users';

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      return await apiService.get<User>(`${this.BASE_PATH}/profile/me`);
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      return await apiService.put<User>(`${this.BASE_PATH}/profile/me`, updates);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File): Promise<ApiResponse<User>> {
    try {
      return await apiService.uploadFile<User>(
        `${this.BASE_PATH}/profile/me/picture`,
        file,
        'file'
      );
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      throw error;
    }
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username: string): Promise<ApiResponse<User>> {
    try {
      return await apiService.get<User>(`${this.BASE_PATH}/profile/username/${username}`);
    } catch (error) {
      console.error('Failed to get profile by username:', error);
      throw error;
    }
  }

  /**
   * Get creator dashboard data
   */
  async getCreatorDashboard(): Promise<ApiResponse<CreatorDashboard>> {
    try {
      return await apiService.get<CreatorDashboard>(`${this.BASE_PATH}/profile/creator-dashboard`);
    } catch (error) {
      console.error('Failed to get creator dashboard:', error);
      throw error;
    }
  }

  /**
   * Get viewer dashboard data
   */
  async getViewerDashboard(): Promise<ApiResponse<ViewerDashboard>> {
    try {
      return await apiService.get<ViewerDashboard>(`${this.BASE_PATH}/profile/viewer-dashboard`);
    } catch (error) {
      console.error('Failed to get viewer dashboard:', error);
      throw error;
    }
  }

  /**
   * Get user wallet information
   */
  async getWallet(): Promise<ApiResponse<Wallet>> {
    try {
      return await apiService.get<Wallet>(`${this.BASE_PATH}/wallet`);
    } catch (error) {
      console.error('Failed to get wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/wallet/transactions${queryString}`;
      return await apiService.get<PaginatedResponse<WalletTransaction>>(url);
    } catch (error) {
      console.error('Failed to get wallet transactions:', error);
      throw error;
    }
  }

  /**
   * Add tokens to wallet (admin only)
   */
  async addTokensToWallet(userId: string, amount: number, reason: string): Promise<ApiResponse<Wallet>> {
    try {
      return await apiService.post<Wallet>(`${this.BASE_PATH}/${userId}/wallet/add`, {
        amount,
        reason
      });
    } catch (error) {
      console.error('Failed to add tokens to wallet:', error);
      throw error;
    }
  }

  /**
   * Deduct tokens from wallet (admin only)
   */
  async deductTokensFromWallet(userId: string, amount: number, reason: string): Promise<ApiResponse<Wallet>> {
    try {
      return await apiService.post<Wallet>(`${this.BASE_PATH}/${userId}/wallet/deduct`, {
        amount,
        reason
      });
    } catch (error) {
      console.error('Failed to deduct tokens from wallet:', error);
      throw error;
    }
  }

  /**
   * Search users by username or name
   */
  async searchUsers(query: string, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const queryString = apiService.buildQueryString({ query, page, size });
      const url = `${this.BASE_PATH}/search${queryString}`;
      return await apiService.get<PaginatedResponse<User>>(url);
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/${userId}/follow`);
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/${userId}/follow`);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/${userId}/followers${queryString}`;
      return await apiService.get<PaginatedResponse<User>>(url);
    } catch (error) {
      console.error('Failed to get followers:', error);
      throw error;
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/${userId}/following${queryString}`;
      return await apiService.get<PaginatedResponse<User>>(url);
    } catch (error) {
      console.error('Failed to get following:', error);
      throw error;
    }
  }

  /**
   * Check if current user follows another user
   */
  async isFollowing(userId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/${userId}/is-following`);
    } catch (error) {
      console.error('Failed to check following status:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId?: string): Promise<ApiResponse<{
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    totalFollowers: number;
    totalFollowing: number;
    joinedDate: string;
  }>> {
    try {
      const url = userId ? `${this.BASE_PATH}/${userId}/statistics` : `${this.BASE_PATH}/statistics/me`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/profile/me`);
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  /**
   * Report a user
   */
  async reportUser(userId: string, reason: string, description?: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/${userId}/report`, {
        reason,
        description
      });
    } catch (error) {
      console.error('Failed to report user:', error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/${userId}/block`);
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/${userId}/block`);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/blocked${queryString}`;
      return await apiService.get<PaginatedResponse<User>>(url);
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    language?: string;
    timezone?: string;
  }): Promise<ApiResponse<any>> {
    try {
      return await apiService.put(`${this.BASE_PATH}/preferences`, preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<ApiResponse<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    language: string;
    timezone: string;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/preferences`);
    } catch (error) {
      console.error('Failed to get preferences:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
