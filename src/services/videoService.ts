import { apiService } from './api';
import { API_ENDPOINTS, DEBUG_CONFIG } from '../constants';
import { VideoSourceResolver, VideoSourceData } from '../utils/videoSourceResolver';
import { feedService } from './feedService';
import {
  ApiResponse,
  Video,
  VideoUploadRequest,
  VideoUploadResponse,
  VideoUpdateRequest,
  VideoSearchParams,
  VideoEngagement,
  Comment,
  CommentRequest,
  GuestViewLimit,
  PaginatedResponse,
} from '../types';

/**
 * Enhanced Video Service - Handles all video-related API operations with backend integration
 * Supports both cloud URLs and local paths with proper fallback mechanisms
 */
class VideoService {
  
  // Video Management

  /**
   * Get video feed with pagination
   * @deprecated Use feedService.getFeed() for enhanced personalized feed experience
   * This method now delegates to the new feed service for backward compatibility
   */
  async getVideoFeed(params?: VideoSearchParams): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📹 Getting video feed (migrating to new feed service):', params);
      }

      // Migrate to new personalized feed service
      return await feedService.migrateFromVideoFeed(params);
    } catch (error) {
      console.error('Error getting video feed:', error);
      
      // Fallback to legacy endpoint if new feed service fails
      try {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('📹 Falling back to legacy video feed endpoint');
        }
        
        const queryString = params ? apiService.buildQueryString(params) : '';
        const url = `${API_ENDPOINTS.VIDEOS.FEED}${queryString}`;
        
        return await apiService.get<PaginatedResponse<Video>>(url);
      } catch (fallbackError) {
        console.error('Error with legacy video feed fallback:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  /**
   * Get personalized video feed (recommended method)
   * Direct access to the new feed service
   */
  async getPersonalizedFeed(params?: any): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📺 Getting personalized feed via feed service:', params);
      }

      return await feedService.getFeed(params);
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      throw error;
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string): Promise<ApiResponse<Video>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.DETAILS, { videoId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📹 Getting video by ID:', videoId);
      }

      return await apiService.get<Video>(url);
    } catch (error) {
      console.error('Error getting video by ID:', error);
      throw error;
    }
  }

  /**
   * Search videos
   */
  async searchVideos(params: VideoSearchParams): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.VIDEOS.SEARCH}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔍 Searching videos:', params);
      }

      return await apiService.get<PaginatedResponse<Video>>(url);
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  }

  /**
   * Get user's uploaded videos
   */
  async getUserVideos(userId?: string, params?: VideoSearchParams): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const queryString = params ? apiService.buildQueryString(params) : '';
      const url = `${API_ENDPOINTS.VIDEOS.MY_VIDEOS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('👤 Getting user videos:', userId, params);
      }

      return await apiService.get<PaginatedResponse<Video>>(url);
    } catch (error) {
      console.error('Error getting user videos:', error);
      throw error;
    }
  }

  // Video Upload

  /**
   * Upload a video file (converts to URL-based upload)
   */
  async uploadVideo(file: File, metadata: Omit<VideoUploadRequest, 'videoUrl'>): Promise<ApiResponse<VideoUploadResponse>> {
    try {
      // First, upload the file to get a URL
      const uploadResponse = await this.uploadVideoFile(file);
      
      if (!uploadResponse.success || !uploadResponse.data.videoUrl) {
        throw new Error('Failed to upload video file');
      }

      // Then create the video record with the URL
      const videoData: VideoUploadRequest = {
        ...metadata,
        videoUrl: uploadResponse.data.videoUrl
      };

      return await apiService.post<VideoUploadResponse>(API_ENDPOINTS.VIDEOS.UPLOAD, videoData);
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  }

  /**
   * Upload video file and get URL
   */
  async uploadVideoFile(file: File): Promise<ApiResponse<{ videoUrl: string; uploadId: string }>> {
    try {
      return await apiService.uploadFile<{ videoUrl: string; uploadId: string }>(
        '/videos/upload-file',
        file,
        'file'
      );
    } catch (error) {
      console.error('Failed to upload video file:', error);
      throw error;
    }
  }

  /**
   * Upload video from URL (direct backend method)
   */
  async uploadVideoFromUrl(metadata: VideoUploadRequest): Promise<ApiResponse<VideoUploadResponse>> {
    try {
      return await apiService.post<VideoUploadResponse>(API_ENDPOINTS.VIDEOS.UPLOAD, metadata);
    } catch (error) {
      console.error('Failed to upload video from URL:', error);
      throw error;
    }
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<ApiResponse<VideoUploadResponse>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.UPLOAD_STATUS, { uploadId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting upload status:', uploadId);
      }

      return await apiService.get<VideoUploadResponse>(url);
    } catch (error) {
      console.error('Error getting upload status:', error);
      throw error;
    }
  }

  /**
   * Update video metadata
   */
  async updateVideo(videoId: string, updates: VideoUpdateRequest): Promise<ApiResponse<Video>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.UPDATE, { videoId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✏️ Updating video:', videoId, updates);
      }

      return await apiService.put<Video>(url, updates);
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<ApiResponse<any>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.DELETE, { videoId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🗑️ Deleting video:', videoId);
      }

      return await apiService.delete(url);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  // Video Streaming

  /**
   * Get video stream URL with unified video source handling
   */
  async getStreamUrl(videoId: string, quality: string = '720p'): Promise<ApiResponse<{ streamUrl: string; videoPath?: string; isLocal?: boolean; isCloud?: boolean; provider?: string }>> {
    try {
      // First get video details to check for video URL/path
      const videoDetails = await this.getVideoById(videoId);
      
      if (videoDetails.success && videoDetails.data) {
        const video = videoDetails.data;
        
        // Use unified video source resolver
        const videoSourceData: VideoSourceData = {
          videoUrl: video.videoUrl,
          videoPath: video.videoPath,
          streamUrl: video.streamUrl
        };
        
        const resolvedSource = await VideoSourceResolver.resolveVideoSource(videoSourceData, videoId, quality);
        
        if (resolvedSource.success) {
          return {
            success: true,
            message: resolvedSource.message,
            data: {
              streamUrl: resolvedSource.data.streamUrl,
              videoPath: resolvedSource.data.videoPath,
              isLocal: resolvedSource.data.isLocal,
              isCloud: resolvedSource.data.isCloud,
              provider: resolvedSource.data.provider
            }
          };
        }
      }
      
      // Fallback to backend streaming endpoint if video details not available
      const streamEndpoint = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.STREAM, { videoId });
      const backendStreamUrl = `${apiService.getBaseUrl()}${streamEndpoint}?quality=${quality}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎬 Using backend streaming endpoint fallback:', backendStreamUrl);
      }

      return {
        success: true,
        message: 'Using backend streaming endpoint',
        data: {
          streamUrl: backendStreamUrl,
          isLocal: false,
          isCloud: false
        }
      };
    } catch (error) {
      console.error('Error getting stream URL:', error);
      
      // Final fallback to sample video
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎬 Using fallback sample video');
      }
      
      return {
        success: true,
        message: 'Using fallback sample video',
        data: {
          streamUrl: VideoSourceResolver.getSampleVideoUrl(),
          isLocal: false,
          isCloud: true,
          provider: 'sample'
        }
      };
    }
  }

  /**
   * Record video view
   */
  async recordView(videoId: string): Promise<ApiResponse<any>> {
    try {
      // Use the details endpoint to record view (backend handles view counting)
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.DETAILS, { videoId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('�️ Recording view:', videoId);
      }

      return await apiService.get(url);
    } catch (error) {
      console.error('Error recording view:', error);
      throw error;
    }
  }

  // Video Engagement

  /**
   * Toggle video like
   */
  async toggleLike(videoId: string): Promise<ApiResponse<VideoEngagement>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.LIKE, { videoId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('❤️ Toggling like:', videoId);
      }

      return await apiService.post<VideoEngagement>(url);
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Get video engagement data
   */
  async getEngagement(videoId: string): Promise<ApiResponse<VideoEngagement>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.DETAILS, { videoId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('� Getting engagement:', videoId);
      }

      return await apiService.get<VideoEngagement>(url);
    } catch (error) {
      console.error('Error getting engagement:', error);
      throw error;
    }
  }

  // Comments

  /**
   * Get video comments
   */
  async getComments(videoId: string, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.COMMENTS, { videoId });
      const queryString = apiService.buildQueryString({ page, size });
      const fullUrl = `${url}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('� Getting comments:', videoId, { page, size });
      }

      return await apiService.get<PaginatedResponse<Comment>>(fullUrl);
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Add comment to video
   */
  async addComment(commentData: CommentRequest): Promise<ApiResponse<Comment>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('💬 Adding comment:', commentData);
      }

      // Use the comments endpoint for adding comments
      const url = apiService.replaceUrlParams(API_ENDPOINTS.VIDEOS.COMMENTS, { videoId: commentData.videoId });
      return await apiService.post<Comment>(url, commentData);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Update comment
   */
  async updateComment(commentId: string, content: string): Promise<ApiResponse<Comment>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✏️ Updating comment:', commentId, content);
      }

      // Comment update functionality not available in current API
      throw new Error('Comment update functionality not implemented in backend');
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🗑️ Deleting comment:', commentId);
      }

      // Comment delete functionality not available in current API
      throw new Error('Comment delete functionality not implemented in backend');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Guest User Features

  /**
   * Get guest view limit status
   */
  async getGuestViewLimit(): Promise<ApiResponse<GuestViewLimit>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('� Getting guest view limit');
      }

      return await apiService.get<GuestViewLimit>(API_ENDPOINTS.VIDEOS.GUEST_LIMIT);
    } catch (error) {
      console.error('Error getting guest view limit:', error);
      throw error;
    }
  }

  /**
   * Check if guest can view video
   */
  async canGuestViewVideo(videoId: string): Promise<ApiResponse<{ canView: boolean; reason?: string }>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('👤 Checking guest view permission:', videoId);
      }

      // Use guest limit endpoint to check permissions
      const limitResponse = await this.getGuestViewLimit();
      return {
        success: true,
        message: 'Guest view check completed',
        data: {
          canView: !limitResponse.data?.isLimitReached,
          reason: limitResponse.data?.isLimitReached ? 'Guest view limit reached' : undefined
        }
      };
    } catch (error) {
      console.error('Error checking guest view permission:', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl(videoId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    // Generate thumbnail URL based on video ID
    return `${API_ENDPOINTS.VIDEOS.DETAILS.replace('{videoId}', videoId)}/thumbnail?size=${size}`;
  }

  /**
   * Generate video share URL
   */
  getShareUrl(videoId: string): string {
    return `${window.location.origin}/video/${videoId}`;
  }

  /**
   * Format video duration
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Format view count
   */
  formatViewCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    } else {
      return `${count} views`;
    }
  }

  /**
   * Validate video file
   */
  validateVideoFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 500MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported. Please use MP4, WebM, OGG, AVI, or MOV' };
    }

    return { isValid: true };
  }
}

// Create and export singleton instance
export const videoService = new VideoService();
export default videoService;
