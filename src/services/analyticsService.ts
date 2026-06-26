import { apiService } from './api';
import { ApiResponse, Video, User, VideoAnalytics, UserAnalytics } from '../types';

export interface PlatformAnalytics {
  userGrowth: {
    labels: string[];
    data: number[];
    growth: number;
  };
  videoUploads: {
    labels: string[];
    data: number[];
    growth: number;
  };
  engagement: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    averageEngagement: number;
    engagementGrowth: number;
  };
  revenue: {
    labels: string[];
    data: number[];
    totalRevenue: number;
    revenueGrowth: number;
  };
  demographics: {
    ageGroups: { label: string; value: number }[];
    locations: { label: string; value: number }[];
    devices: { label: string; value: number }[];
  };
}

export interface ContentAnalytics {
  topVideos: (Video & { metrics: { views: number; likes: number; comments: number; engagement: number } })[];
  topCreators: (User & { metrics: { totalVideos: number; totalViews: number; totalFollowers: number; engagement: number } })[];
  popularGenres: { genre: string; count: number; percentage: number }[];
  contentTrends: {
    labels: string[];
    genres: { [genre: string]: number[] };
  };
  performanceMetrics: {
    averageViews: number;
    averageLikes: number;
    averageComments: number;
    averageDuration: number;
    completionRate: number;
  };
}

export interface UserBehaviorAnalytics {
  sessionDuration: {
    average: number;
    distribution: { range: string; count: number }[];
  };
  userJourney: {
    entryPoints: { source: string; count: number }[];
    exitPoints: { page: string; count: number }[];
    commonPaths: { path: string; count: number }[];
  };
  featureUsage: {
    videoUploads: number;
    aiToolUsage: number;
    practiceQuestions: number;
    socialInteractions: number;
  };
  retentionMetrics: {
    daily: number;
    weekly: number;
    monthly: number;
    cohortAnalysis: { cohort: string; retention: number[] }[];
  };
}

export interface RevenueAnalytics {
  overview: {
    totalRevenue: number;
    monthlyRecurring: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  breakdown: {
    coinPackages: { package: string; revenue: number; count: number }[];
    aiToolRevenue: { tool: string; revenue: number; executions: number }[];
    subscriptions: { plan: string; revenue: number; subscribers: number }[];
  };
  trends: {
    labels: string[];
    revenue: number[];
    transactions: number[];
    growth: number;
  };
  forecasting: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}

class AnalyticsService {
  private readonly BASE_PATH = '/analytics';

  // Platform Analytics

  /**
   * Get comprehensive platform analytics
   */
  async getPlatformAnalytics(timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<PlatformAnalytics>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/platform${queryString}`;
      return await apiService.get<PlatformAnalytics>(url);
    } catch (error) {
      console.error('Failed to get platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get user growth analytics
   */
  async getUserGrowthAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    labels: string[];
    newUsers: number[];
    activeUsers: number[];
    totalUsers: number[];
    growthRate: number;
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/users/growth${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get user growth analytics:', error);
      throw error;
    }
  }

  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    labels: string[];
    views: number[];
    likes: number[];
    comments: number[];
    shares: number[];
    averageEngagement: number;
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/engagement${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get engagement analytics:', error);
      throw error;
    }
  }

  // Content Analytics

  /**
   * Get content analytics
   */
  async getContentAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<ContentAnalytics>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/content${queryString}`;
      return await apiService.get<ContentAnalytics>(url);
    } catch (error) {
      console.error('Failed to get content analytics:', error);
      throw error;
    }
  }

  /**
   * Get video performance analytics
   */
  async getVideoAnalytics(videoId: string): Promise<ApiResponse<VideoAnalytics>> {
    try {
      return await apiService.get<VideoAnalytics>(`${this.BASE_PATH}/videos/${videoId}`);
    } catch (error) {
      console.error('Failed to get video analytics:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId?: string): Promise<ApiResponse<UserAnalytics>> {
    try {
      const url = userId ? `${this.BASE_PATH}/users/${userId}` : `${this.BASE_PATH}/users/me`;
      return await apiService.get<UserAnalytics>(url);
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(timeRange: 'day' | 'week' | 'month' = 'week', limit: number = 10): Promise<ApiResponse<{
    videos: Video[];
    creators: User[];
    genres: string[];
    tags: string[];
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange, limit });
      const url = `${this.BASE_PATH}/trending${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get trending content:', error);
      throw error;
    }
  }

  // User Behavior Analytics

  /**
   * Get user behavior analytics
   */
  async getUserBehaviorAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<UserBehaviorAnalytics>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/behavior${queryString}`;
      return await apiService.get<UserBehaviorAnalytics>(url);
    } catch (error) {
      console.error('Failed to get user behavior analytics:', error);
      throw error;
    }
  }

  /**
   * Get retention analytics
   */
  async getRetentionAnalytics(): Promise<ApiResponse<{
    daily: number;
    weekly: number;
    monthly: number;
    cohorts: { cohort: string; retention: number[] }[];
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/retention`);
    } catch (error) {
      console.error('Failed to get retention analytics:', error);
      throw error;
    }
  }

  /**
   * Get funnel analytics
   */
  async getFunnelAnalytics(funnelType: 'registration' | 'video_upload' | 'payment' = 'registration'): Promise<ApiResponse<{
    steps: { name: string; users: number; conversionRate: number }[];
    totalConversion: number;
  }>> {
    try {
      const queryString = apiService.buildQueryString({ type: funnelType });
      const url = `${this.BASE_PATH}/funnel${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get funnel analytics:', error);
      throw error;
    }
  }

  // Revenue Analytics

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<RevenueAnalytics>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/revenue${queryString}`;
      return await apiService.get<RevenueAnalytics>(url);
    } catch (error) {
      console.error('Failed to get revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    labels: string[];
    successful: number[];
    failed: number[];
    revenue: number[];
    successRate: number;
    averageAmount: number;
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/payments${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get payment analytics:', error);
      throw error;
    }
  }

  // AI Tools Analytics

  /**
   * Get AI tools analytics
   */
  async getAIToolsAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    totalExecutions: number;
    totalRevenue: number;
    topTools: { toolId: string; name: string; executions: number; revenue: number }[];
    usageByCategory: { category: string; executions: number }[];
    trends: {
      labels: string[];
      executions: number[];
      revenue: number[];
    };
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/ai-tools${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get AI tools analytics:', error);
      throw error;
    }
  }

  // Practice Analytics

  /**
   * Get practice analytics
   */
  async getPracticeAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    totalSubmissions: number;
    averageScore: number;
    completionRate: number;
    popularCategories: { category: string; submissions: number }[];
    difficultyDistribution: { difficulty: string; count: number }[];
    trends: {
      labels: string[];
      submissions: number[];
      averageScore: number[];
    };
  }>> {
    try {
      const queryString = apiService.buildQueryString({ timeRange });
      const url = `${this.BASE_PATH}/practice${queryString}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Failed to get practice analytics:', error);
      throw error;
    }
  }

  // Real-time Analytics

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(): Promise<ApiResponse<{
    activeUsers: number;
    currentViews: number;
    recentUploads: number;
    ongoingExecutions: number;
    systemLoad: number;
    responseTime: number;
  }>> {
    try {
      return await apiService.get(`${this.BASE_PATH}/realtime`);
    } catch (error) {
      console.error('Failed to get real-time analytics:', error);
      throw error;
    }
  }

  // Custom Analytics

  /**
   * Create custom analytics query
   */
  async createCustomQuery(query: {
    metrics: string[];
    dimensions: string[];
    filters?: { [key: string]: any };
    timeRange: { start: string; end: string };
    groupBy?: string;
    orderBy?: string;
    limit?: number;
  }): Promise<ApiResponse<{
    data: any[];
    metadata: {
      totalRows: number;
      executionTime: number;
      query: string;
    };
  }>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/custom`, query);
    } catch (error) {
      console.error('Failed to execute custom analytics query:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    type: 'platform' | 'content' | 'users' | 'revenue' | 'custom',
    format: 'csv' | 'json' | 'xlsx' = 'csv',
    timeRange: 'day' | 'week' | 'month' | 'year' = 'month',
    customQuery?: any
  ): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
    try {
      const payload = {
        type,
        format,
        timeRange,
        ...(customQuery && { query: customQuery })
      };
      return await apiService.post(`${this.BASE_PATH}/export`, payload);
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw error;
    }
  }

  // Bulk Operations

  /**
   * Bulk update video analytics
   */
  async bulkUpdateVideoAnalytics(videoIds: string[]): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/bulk/videos/update`, { videoIds });
    } catch (error) {
      console.error('Failed to bulk update video analytics:', error);
      throw error;
    }
  }

  /**
   * Bulk recalculate user metrics
   */
  async bulkRecalculateUserMetrics(userIds: string[]): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/bulk/users/recalculate`, { userIds });
    } catch (error) {
      console.error('Failed to bulk recalculate user metrics:', error);
      throw error;
    }
  }

  /**
   * Bulk refresh analytics cache
   */
  async bulkRefreshCache(cacheKeys: string[]): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/bulk/cache/refresh`, { cacheKeys });
    } catch (error) {
      console.error('Failed to bulk refresh analytics cache:', error);
      throw error;
    }
  }

  /**
   * Bulk generate reports
   */
  async bulkGenerateReports(reports: {
    type: string;
    recipients: string[];
    schedule?: 'daily' | 'weekly' | 'monthly';
  }[]): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/bulk/reports/generate`, { reports });
    } catch (error) {
      console.error('Failed to bulk generate reports:', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Calculate growth rate
   */
  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Format analytics number
   */
  formatNumber(num: number, precision: number = 1): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(precision)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(precision)}K`;
    } else {
      return num.toString();
    }
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number, precision: number = 1): string {
    return `${value.toFixed(precision)}%`;
  }

  /**
   * Get time range labels
   */
  getTimeRangeLabels(timeRange: 'day' | 'week' | 'month' | 'year', count: number = 7): string[] {
    const labels: string[] = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      
      switch (timeRange) {
        case 'day':
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          break;
        case 'week':
          date.setDate(date.getDate() - (i * 7));
          labels.push(`Week ${Math.ceil(date.getDate() / 7)}`);
          break;
        case 'month':
          date.setMonth(date.getMonth() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - i);
          labels.push(date.getFullYear().toString());
          break;
      }
    }

    return labels;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
