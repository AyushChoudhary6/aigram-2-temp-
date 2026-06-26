import { apiService } from './api';
import { 
  ApiResponse, 
  AdminDashboard, 
  AdminVideoReviewRequest, 
  AdminVideoReviewResponse,
  AdminUserUpdateRequest,
  SystemHealth,
  Video,
  User,
  AITool,
  Payment,
  PaginatedResponse 
} from '../types';

class AdminService {
  private readonly BASE_PATH = '/admin';

  /**
   * Get admin dashboard data
   */
  async getDashboard(): Promise<ApiResponse<AdminDashboard>> {
    try {
      return await apiService.get<AdminDashboard>(`${this.BASE_PATH}/dashboard`);
    } catch (error) {
      console.error('Failed to get admin dashboard:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    try {
      return await apiService.get<SystemHealth>(`${this.BASE_PATH}/system/health`);
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }

  // User Management

  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/users${queryString}`;
      return await apiService.get<PaginatedResponse<User>>(url);
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Update user status (active/inactive)
   */
  async updateUserStatus(userId: string, updates: AdminUserUpdateRequest): Promise<ApiResponse<User>> {
    try {
      return await apiService.put<User>(`${this.BASE_PATH}/users/${userId}/status`, updates);
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, updates: AdminUserUpdateRequest): Promise<ApiResponse<User>> {
    try {
      return await apiService.put<User>(`${this.BASE_PATH}/users/${userId}/role`, updates);
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/users/${userId}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    userGrowthRate: number;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/users/statistics`);
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: string, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/users/${userId}/activity${queryString}`;
      return await apiService.get<PaginatedResponse<any>>(url);
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }

  /**
   * Bulk update user status
   */
  async bulkUpdateUserStatus(userIds: string[], updates: AdminUserUpdateRequest): Promise<ApiResponse<any>> {
    try {
      return await apiService.put(`${this.BASE_PATH}/users/bulk/status`, {
        userIds,
        ...updates
      });
    } catch (error) {
      console.error('Failed to bulk update user status:', error);
      throw error;
    }
  }

  // Video Management

  /**
   * Get all videos for admin review
   */
  async getVideos(page: number = 0, size: number = 20, status?: string): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const params: any = { page, size };
      if (status) params.status = status;
      
      const queryString = apiService.buildQueryString(params);
      const url = `${this.BASE_PATH}/videos${queryString}`;
      return await apiService.get<PaginatedResponse<Video>>(url);
    } catch (error) {
      console.error('Failed to get videos:', error);
      throw error;
    }
  }

  /**
   * Get pending videos for review
   */
  async getPendingVideos(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      return await this.getVideos(page, size, 'PENDING');
    } catch (error) {
      console.error('Failed to get pending videos:', error);
      throw error;
    }
  }

  /**
   * Review video (approve/reject)
   */
  async reviewVideo(videoId: string, review: AdminVideoReviewRequest): Promise<ApiResponse<AdminVideoReviewResponse>> {
    try {
      return await apiService.post<AdminVideoReviewResponse>(`${this.BASE_PATH}/videos/${videoId}/review`, review);
    } catch (error) {
      console.error('Failed to review video:', error);
      throw error;
    }
  }

  /**
   * Bulk approve videos
   */
  async bulkApproveVideos(videoIds: string[], reason: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/videos/bulk/approve`, {
        videoIds,
        reason
      });
    } catch (error) {
      console.error('Failed to bulk approve videos:', error);
      throw error;
    }
  }

  /**
   * Bulk reject videos
   */
  async bulkRejectVideos(videoIds: string[], reason: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/videos/bulk/reject`, {
        videoIds,
        reason
      });
    } catch (error) {
      console.error('Failed to bulk reject videos:', error);
      throw error;
    }
  }

  /**
   * Delete video (admin)
   */
  async deleteVideo(videoId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/videos/${videoId}`);
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw error;
    }
  }

  /**
   * Get video statistics
   */
  async getVideoStatistics(): Promise<ApiResponse<{
    totalVideos: number;
    pendingVideos: number;
    approvedVideos: number;
    rejectedVideos: number;
    totalViews: number;
    averageRating: number;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/videos/statistics`);
    } catch (error) {
      console.error('Failed to get video statistics:', error);
      throw error;
    }
  }

  // AI Tools Management

  /**
   * Get all AI tools for admin review
   */
  async getAITools(page: number = 0, size: number = 20, status?: string): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    try {
      const params: any = { page, size };
      if (status) params.status = status;
      
      const queryString = apiService.buildQueryString(params);
      const url = `${this.BASE_PATH}/ai-tools${queryString}`;
      return await apiService.get<PaginatedResponse<AITool>>(url);
    } catch (error) {
      console.error('Failed to get AI tools:', error);
      throw error;
    }
  }

  /**
   * Get pending AI tools for review
   */
  async getPendingAITools(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    try {
      return await this.getAITools(page, size, 'PENDING');
    } catch (error) {
      console.error('Failed to get pending AI tools:', error);
      throw error;
    }
  }

  /**
   * Approve AI tool
   */
  async approveAITool(toolId: string, reason: string): Promise<ApiResponse<AITool>> {
    try {
      return await apiService.post<AITool>(`${this.BASE_PATH}/ai-tools/${toolId}/approve`, { reason });
    } catch (error) {
      console.error('Failed to approve AI tool:', error);
      throw error;
    }
  }

  /**
   * Reject AI tool
   */
  async rejectAITool(toolId: string, reason: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/ai-tools/${toolId}/reject`, { reason });
    } catch (error) {
      console.error('Failed to reject AI tool:', error);
      throw error;
    }
  }

  /**
   * Delete AI tool (admin)
   */
  async deleteAITool(toolId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/ai-tools/${toolId}`);
    } catch (error) {
      console.error('Failed to delete AI tool:', error);
      throw error;
    }
  }

  /**
   * Get AI tools statistics
   */
  async getAIToolsStatistics(): Promise<ApiResponse<{
    totalTools: number;
    pendingTools: number;
    approvedTools: number;
    rejectedTools: number;
    totalExecutions: number;
    totalRevenue: number;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/ai-tools/statistics`);
    } catch (error) {
      console.error('Failed to get AI tools statistics:', error);
      throw error;
    }
  }

  // Payment Management

  /**
   * Get all payments
   */
  async getPayments(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${this.BASE_PATH}/payments${queryString}`;
      return await apiService.get<PaginatedResponse<Payment>>(url);
    } catch (error) {
      console.error('Failed to get payments:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(): Promise<ApiResponse<{
    totalPayments: number;
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    revenueGrowth: number;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/payments/statistics`);
    } catch (error) {
      console.error('Failed to get payment statistics:', error);
      throw error;
    }
  }

  // Analytics

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<ApiResponse<{
    userGrowth: number[];
    videoUploads: number[];
    revenue: number[];
    engagement: number[];
    labels: string[];
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/analytics/platform${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(): Promise<ApiResponse<{
    topVideos: Video[];
    topCreators: User[];
    popularGenres: { genre: string; count: number }[];
    engagementMetrics: any;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/analytics/content`);
    } catch (error) {
      console.error('Failed to get content analytics:', error);
      throw error;
    }
  }

  /**
   * Export data
   */
  async exportData(type: 'users' | 'videos' | 'payments' | 'analytics', format: 'csv' | 'json' = 'csv'): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/export`, { type, format });
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  // System Operations

  /**
   * Clear cache
   */
  async clearCache(): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/system/clear-cache`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Restart services
   */
  async restartServices(): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/system/restart`);
    } catch (error) {
      console.error('Failed to restart services:', error);
      throw error;
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(page: number = 0, size: number = 50, level?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const params: any = { page, size };
      if (level) params.level = level;
      
      const queryString = apiService.buildQueryString(params);
      const url = `${this.BASE_PATH}/system/logs${queryString}`;
      return await apiService.get<PaginatedResponse<any>>(url);
    } catch (error) {
      console.error('Failed to get system logs:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
