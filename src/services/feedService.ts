import { apiService } from './api';
import { API_ENDPOINTS, DEBUG_CONFIG, FEED_CONFIG } from '../constants';
import {
  ApiResponse,
  Video,
  PaginatedResponse,
  FeedParams,
  FeedPreferences,
  FeedRefreshRequest,
  FeedRefreshResponse,
} from '../types';

/**
 * Feed Service - Handles personalized video feed operations
 * Implements the new /api/feed endpoints for enhanced user experience
 */
class FeedService {
  
  // Feed Management

  /**
   * Get personalized video feed
   * Replaces the old /api/videos/feed endpoint with enhanced personalization
   */
  async getFeed(params?: FeedParams): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      // Set default parameters with new feed configuration
      const feedParams: FeedParams = {
        page: params?.page ?? 0,
        size: params?.size ?? FEED_CONFIG.DEFAULT_PAGE_SIZE,
        algorithm: params?.algorithm ?? (FEED_CONFIG.ALGORITHMS.PERSONALIZED as 'PERSONALIZED'),
        sortBy: params?.sortBy,
        sortDirection: params?.sortDirection,
        genre: params?.genre,
        excludeGenres: params?.excludeGenres,
        minEngagement: params?.minEngagement,
        maxAge: params?.maxAge,
      };

      const queryString = apiService.buildQueryString(feedParams);
      const url = `${API_ENDPOINTS.FEED.GET_FEED}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📺 Getting personalized feed:', feedParams);
      }

      return await apiService.get<PaginatedResponse<Video>>(url);
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      throw error;
    }
  }

  /**
   * Get feed with specific algorithm
   */
  async getFeedByAlgorithm(
    algorithm: 'PERSONALIZED' | 'TRENDING' | 'LATEST' | 'POPULAR',
    params?: Omit<FeedParams, 'algorithm'>
  ): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const feedParams: FeedParams = {
        page: params?.page ?? 0,
        size: params?.size ?? FEED_CONFIG.DEFAULT_PAGE_SIZE,
        algorithm,
        sortBy: params?.sortBy,
        sortDirection: params?.sortDirection,
        genre: params?.genre,
        excludeGenres: params?.excludeGenres,
        minEngagement: params?.minEngagement,
        maxAge: params?.maxAge,
      };
      
      return await this.getFeed(feedParams);
    } catch (error) {
      console.error(`Error getting ${algorithm} feed:`, error);
      throw error;
    }
  }

  /**
   * Get trending videos feed
   */
  async getTrendingFeed(params?: Omit<FeedParams, 'algorithm'>): Promise<ApiResponse<PaginatedResponse<Video>>> {
    return this.getFeedByAlgorithm('TRENDING', params);
  }

  /**
   * Get latest videos feed
   */
  async getLatestFeed(params?: Omit<FeedParams, 'algorithm'>): Promise<ApiResponse<PaginatedResponse<Video>>> {
    return this.getFeedByAlgorithm('LATEST', params);
  }

  /**
   * Get popular videos feed
   */
  async getPopularFeed(params?: Omit<FeedParams, 'algorithm'>): Promise<ApiResponse<PaginatedResponse<Video>>> {
    return this.getFeedByAlgorithm('POPULAR', params);
  }

  // Feed Preferences

  /**
   * Get user's feed preferences
   */
  async getFeedPreferences(): Promise<ApiResponse<FeedPreferences>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('⚙️ Getting feed preferences');
      }

      return await apiService.get<FeedPreferences>(API_ENDPOINTS.FEED.PREFERENCES);
    } catch (error) {
      console.error('Error getting feed preferences:', error);
      throw error;
    }
  }

  /**
   * Update user's feed preferences
   */
  async updateFeedPreferences(preferences: Partial<FeedPreferences>): Promise<ApiResponse<FeedPreferences>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('⚙️ Updating feed preferences:', preferences);
      }

      return await apiService.put<FeedPreferences>(API_ENDPOINTS.FEED.PREFERENCES, preferences);
    } catch (error) {
      console.error('Error updating feed preferences:', error);
      throw error;
    }
  }

  /**
   * Reset feed preferences to default
   */
  async resetFeedPreferences(): Promise<ApiResponse<FeedPreferences>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔄 Resetting feed preferences to default');
      }

      return await apiService.delete<FeedPreferences>(API_ENDPOINTS.FEED.PREFERENCES);
    } catch (error) {
      console.error('Error resetting feed preferences:', error);
      throw error;
    }
  }

  // Feed Management

  /**
   * Refresh user's feed
   */
  async refreshFeed(refreshRequest?: FeedRefreshRequest): Promise<ApiResponse<FeedRefreshResponse>> {
    try {
      const request: FeedRefreshRequest = {
        algorithm: refreshRequest?.algorithm || (FEED_CONFIG.ALGORITHMS.PERSONALIZED as 'PERSONALIZED'),
        preferences: refreshRequest?.preferences,
      };

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔄 Refreshing feed:', request);
      }

      return await apiService.post<FeedRefreshResponse>(API_ENDPOINTS.FEED.REFRESH, request);
    } catch (error) {
      console.error('Error refreshing feed:', error);
      throw error;
    }
  }

  /**
   * Force refresh feed (clears cache)
   */
  async forceRefreshFeed(): Promise<ApiResponse<FeedRefreshResponse>> {
    return this.refreshFeed({
      algorithm: FEED_CONFIG.ALGORITHMS.PERSONALIZED as 'PERSONALIZED',
    });
  }

  // Feed Position Management

  /**
   * Update feed position
   */
  async updateFeedPosition(lastViewedVideoId: string, position: number): Promise<ApiResponse<any>> {
    try {
      const request = {
        lastViewedVideoId,
        position,
      };

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📍 Updating feed position:', request);
      }

      return await apiService.put(API_ENDPOINTS.FEED.POSITION, request);
    } catch (error) {
      console.error('Error updating feed position:', error);
      throw error;
    }
  }

  /**
   * Reset user feed
   */
  async resetFeed(): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔄 Resetting user feed');
      }

      return await apiService.post(API_ENDPOINTS.FEED.RESET);
    } catch (error) {
      console.error('Error resetting feed:', error);
      throw error;
    }
  }

  /**
   * Get personalized feed (dedicated endpoint)
   */
  async getPersonalizedFeedDirect(params?: Omit<FeedParams, 'algorithm'>): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const queryString = params ? apiService.buildQueryString(params) : '';
      const url = `${API_ENDPOINTS.FEED.PERSONALIZED}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📺 Getting personalized feed (direct endpoint):', params);
      }

      return await apiService.get<PaginatedResponse<Video>>(url);
    } catch (error) {
      console.error('Error getting personalized feed (direct):', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Get default feed parameters
   */
  getDefaultFeedParams(): FeedParams {
    return {
      page: 0,
      size: FEED_CONFIG.DEFAULT_PAGE_SIZE,
      algorithm: FEED_CONFIG.ALGORITHMS.PERSONALIZED as 'PERSONALIZED',
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    };
  }

  /**
   * Validate feed parameters
   */
  validateFeedParams(params: FeedParams): { isValid: boolean; error?: string } {
    if (params.size && params.size > FEED_CONFIG.MAX_PAGE_SIZE) {
      return {
        isValid: false,
        error: `Page size cannot exceed ${FEED_CONFIG.MAX_PAGE_SIZE}`,
      };
    }

    if (params.page && params.page < 0) {
      return {
        isValid: false,
        error: 'Page number cannot be negative',
      };
    }

    if (params.minEngagement && (params.minEngagement < 0 || params.minEngagement > 100)) {
      return {
        isValid: false,
        error: 'Minimum engagement must be between 0 and 100',
      };
    }

    if (params.maxAge && params.maxAge < 0) {
      return {
        isValid: false,
        error: 'Maximum age cannot be negative',
      };
    }

    return { isValid: true };
  }

  /**
   * Build feed query string with validation
   */
  buildValidatedFeedQuery(params: FeedParams): string {
    const validation = this.validateFeedParams(params);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return apiService.buildQueryString(params);
  }

  /**
   * Get feed cache key for client-side caching
   */
  getFeedCacheKey(params: FeedParams): string {
    const keyParams = {
      algorithm: params.algorithm,
      genre: params.genre,
      page: params.page,
      size: params.size,
    };
    
    return `feed_${JSON.stringify(keyParams)}`;
  }

  /**
   * Format feed preferences for display
   */
  formatPreferences(preferences: FeedPreferences): Record<string, string> {
    return {
      'Preferred Categories': preferences.preferredCategories.join(', ') || 'None',
      'Excluded Categories': preferences.excludedCategories.join(', ') || 'None',
      'Algorithm': preferences.algorithm,
    };
  }

  /**
   * Get recommended preferences based on user behavior
   */
  async getRecommendedPreferences(): Promise<ApiResponse<FeedPreferences>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('💡 Getting recommended preferences');
      }

      // This would typically call a backend endpoint that analyzes user behavior
      // For now, return default recommendations
      const recommendedPreferences: FeedPreferences = {
        preferredCategories: ['EDUCATIONAL', 'TECHNOLOGY'],
        excludedCategories: [],
        algorithm: 'PERSONALIZED' as 'PERSONALIZED',
      };

      return {
        success: true,
        message: 'Recommended preferences generated',
        data: recommendedPreferences,
      };
    } catch (error) {
      console.error('Error getting recommended preferences:', error);
      throw error;
    }
  }

  /**
   * Migrate from old video feed to new personalized feed
   * Helper method for backward compatibility
   */
  async migrateFromVideoFeed(oldParams?: any): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      // Convert old video feed parameters to new feed parameters
      const feedParams: FeedParams = {
        page: oldParams?.page || 0,
        size: oldParams?.size || FEED_CONFIG.DEFAULT_PAGE_SIZE,
        algorithm: FEED_CONFIG.ALGORITHMS.PERSONALIZED as 'PERSONALIZED',
        genre: oldParams?.genre,
        sortBy: oldParams?.sortBy,
        sortDirection: oldParams?.sortDirection,
      };

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔄 Migrating from old video feed to new personalized feed:', oldParams, '→', feedParams);
      }

      return await this.getFeed(feedParams);
    } catch (error) {
      console.error('Error migrating from video feed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const feedService = new FeedService();
export default feedService;
