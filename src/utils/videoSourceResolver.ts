import { apiService } from '../services/api';
import { API_ENDPOINTS, DEBUG_CONFIG } from '../constants';
import { ApiResponse } from '../types';

/**
 * Unified Video Source Resolver
 * Handles video source resolution for both VideoService and PracticeVideoService
 * Supports cloud URLs (AWS S3, GCP, Azure, CDN) and local filesystem paths
 */

export interface VideoSourceData {
  videoUrl?: string;  // Cloud-based URL (S3, CDN, etc.)
  videoPath?: string; // Local or relative path
  streamUrl?: string; // Direct stream URL
}

export interface ResolvedVideoSource {
  streamUrl: string;
  videoPath?: string;
  isLocal: boolean;
  isCloud: boolean;
  provider?: string;
}

export class VideoSourceResolver {
  
  // Demo video configuration for validation testing
  private static readonly DEMO_CONFIG = {
    enabled: process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEMO_VIDEO === 'true',
    videoPath: '/Users/pawanjin/Downloads/other/Kabhi_Na_Kabhi_720p.mp4',
    videoIds: ['demo-practice', 'demo-stream'] // IDs that should use demo video
  };

  /**
   * Get demo video source for validation testing
   * This is ONLY for development/validation and should NOT ship to production
   */
  private static getDemoVideoSource(): VideoSourceData | null {
    if (!this.DEMO_CONFIG.enabled) {
      return null;
    }

    console.log('🎬 [DEMO MODE] Using local demo video:', this.DEMO_CONFIG.videoPath);
    return {
      videoPath: this.DEMO_CONFIG.videoPath,
      videoUrl: undefined,
      streamUrl: undefined
    };
  }

  /**
   * Resolve video source from backend data
   */
  static async resolveVideoSource(
    videoData: VideoSourceData,
    videoId: string,
    quality: string = '720p'
  ): Promise<ApiResponse<ResolvedVideoSource>> {
    try {
      // DEMO MODE: Override with local demo video for testing
      if (this.DEMO_CONFIG.enabled && (
        this.DEMO_CONFIG.videoIds.includes(videoId) || 
        videoId.startsWith('demo-') ||
        videoData.videoPath?.includes('demo') ||
        process.env.REACT_APP_FORCE_DEMO_VIDEO === 'true'
      )) {
        const demoVideoData = this.getDemoVideoSource();
        if (demoVideoData) {
          console.log('🎬 [DEMO MODE] Overriding video source with demo video');
          videoData = demoVideoData;
        }
      }
      // Priority 1: Check if video has a direct stream URL
      if (videoData.streamUrl) {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🎬 Using direct stream URL:', videoData.streamUrl);
        }
        
        return {
          success: true,
          message: 'Direct stream URL found',
          data: {
            streamUrl: videoData.streamUrl,
            isLocal: false,
            isCloud: this.isCloudUrl(videoData.streamUrl),
            provider: this.getCloudProvider(videoData.streamUrl)
          }
        };
      }

      // Priority 2: Check if video has a cloud URL or S3 path
      const cloudPath = videoData.videoUrl || videoData.videoPath;
      if (cloudPath && (this.isS3Path(cloudPath) || this.isCloudUrl(cloudPath))) {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🎬 Resolving secure stream URL for cloud path:', cloudPath);
        }

        try {
          // Call backend to resolve the pre-signed URL
          const resolveEndpoint = `${API_ENDPOINTS.VIDEOS.RESOLVE_STREAM_URL}?storagePath=${encodeURIComponent(cloudPath)}`;
          const response = await apiService.get<string>(resolveEndpoint);

          if (response.success && response.data) {
            return {
              success: true,
              message: 'Secure stream URL resolved',
              data: {
                streamUrl: response.data,
                isLocal: false,
                isCloud: true,
                provider: this.getCloudProvider(cloudPath)
              }
            };
          }
        } catch (error) {
          console.warn('⚠️ Failed to resolve secure cloud URL, falling back:', error);
        }
      }
      
      // Priority 3: Check if video has a local path
      if (videoData.videoPath) {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🎬 Processing local video path:', videoData.videoPath);
        }
        
        const streamUrl = await this.processLocalVideoPath(videoData.videoPath, videoId, quality);
        
        return {
          success: true,
          message: 'Local video path processed',
          data: {
            streamUrl,
            videoPath: videoData.videoPath,
            isLocal: true,
            isCloud: false
          }
        };
      }

      // Priority 4: Fallback to backend streaming endpoint
      const streamEndpoint = API_ENDPOINTS.VIDEOS.STREAM.replace('{videoId}', videoId);
      const backendStreamUrl = `${apiService.getBaseUrl()}${streamEndpoint}?quality=${quality}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎬 Using backend streaming endpoint:', backendStreamUrl);
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
      console.error('Error resolving video source:', error);
      
      // Final fallback to sample video
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎬 Using fallback sample video');
      }
      
      return {
        success: true,
        message: 'Using fallback sample video',
        data: {
          streamUrl: this.getSampleVideoUrl(),
          isLocal: false,
          isCloud: true,
          provider: 'sample'
        }
      };
    }
  }

  /**
   * Check if URL is a cloud-based URL
   */
  static isCloudUrl(url: string): boolean {
    const cloudPatterns = [
      /^https?:\/\/.*\.amazonaws\.com/,           // AWS S3
      /^https?:\/\/.*\.cloudfront\.net/,         // CloudFront
      /^https?:\/\/.*\.googleapis\.com/,         // Google Cloud Storage
      /^https?:\/\/.*\.azure\.com/,              // Azure Blob Storage
      /^https?:\/\/.*\.digitaloceanspaces\.com/, // DigitalOcean Spaces
      /^https?:\/\/.*\.r2\.cloudflarestorage\.com/, // Cloudflare R2
      /^https?:\/\/.*\.b-cdn\.net/,              // BunnyCDN
      /^https?:\/\/.*\.fastly\.com/,             // Fastly CDN
      /^https?:\/\/.*\.jsdelivr\.net/,           // jsDelivr CDN
      /^https?:\/\/.*\.unpkg\.com/,              // unpkg CDN
    ];
    
    return cloudPatterns.some(pattern => pattern.test(url)) || url.startsWith('http');
  }

  /**
   * Check if path is an S3 storage path
   */
  static isS3Path(path: string): boolean {
    return path.startsWith('s3://') || path.startsWith('aws-s3://');
  }

  /**
   * Get cloud provider from URL
   */
  static getCloudProvider(url: string): string {
    if (url.includes('amazonaws.com')) return 'AWS S3';
    if (url.includes('cloudfront.net')) return 'CloudFront';
    if (url.includes('googleapis.com')) return 'Google Cloud';
    if (url.includes('azure.com')) return 'Azure';
    if (url.includes('digitaloceanspaces.com')) return 'DigitalOcean';
    if (url.includes('r2.cloudflarestorage.com')) return 'Cloudflare R2';
    if (url.includes('b-cdn.net')) return 'BunnyCDN';
    if (url.includes('fastly.com')) return 'Fastly';
    if (url.includes('jsdelivr.net')) return 'jsDelivr';
    if (url.includes('unpkg.com')) return 'unpkg';
    return 'Unknown CDN';
  }

  /**
   * Process local video path and convert to streamable URL
   */
  static async processLocalVideoPath(videoPath: string, videoId: string, quality: string): Promise<string> {
    try {
      // If path is already a full URL, return it
      if (videoPath.startsWith('http')) {
        return videoPath;
      }
      
      // DEMO MODE: Handle demo video file path
      if (this.DEMO_CONFIG.enabled && videoPath === this.DEMO_CONFIG.videoPath) {
        console.log('🎬 [DEMO MODE] Processing demo video file path');
        
        // For web platform, try to create a file URL
        if (typeof window !== 'undefined' && window.location) {
          // In web environment, we need to serve the file through a local server
          // For now, fallback to sample video since we can't directly access local files in browser
          console.warn('🎬 [DEMO MODE] Cannot access local file in web browser, using sample video');
          return this.getSampleVideoUrl();
        }
        
        // For React Native, we can use file:// protocol
        if (videoPath.startsWith('/')) {
          const fileUrl = `file://${videoPath}`;
          console.log('🎬 [DEMO MODE] Using file URL:', fileUrl);
          return fileUrl;
        }
      }
      
      // If it's a relative path starting with /, construct full URL
      if (videoPath.startsWith('/')) {
        return `${apiService.getBaseUrl()}${videoPath}`;
      }
      
      // If it's a local file path, use the streaming endpoint with path parameter
      const streamEndpoint = API_ENDPOINTS.VIDEOS.STREAM.replace('{videoId}', videoId);
      return `${apiService.getBaseUrl()}${streamEndpoint}?quality=${quality}&path=${encodeURIComponent(videoPath)}`;
    } catch (error) {
      console.error('Error processing local video path:', error);
      throw error;
    }
  }

  /**
   * Get sample video URL for fallback
   */
  static getSampleVideoUrl(): string {
    // Return a reliable sample video URL for development/testing
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  /**
   * Validate video source data
   */
  static validateVideoSource(videoData: VideoSourceData): { isValid: boolean; error?: string } {
    if (!videoData) {
      return { isValid: false, error: 'Video data is required' };
    }

    // At least one source should be available
    if (!videoData.videoUrl && !videoData.videoPath && !videoData.streamUrl) {
      return { isValid: false, error: 'No video source available (videoUrl, videoPath, or streamUrl required)' };
    }

    // Validate URLs if present
    if (videoData.videoUrl && !this.isValidUrl(videoData.videoUrl)) {
      return { isValid: false, error: 'Invalid video URL format' };
    }

    if (videoData.streamUrl && !this.isValidUrl(videoData.streamUrl)) {
      return { isValid: false, error: 'Invalid stream URL format' };
    }

    return { isValid: true };
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get video quality options
   */
  static getQualityOptions(): Array<{ value: string; label: string; resolution: string }> {
    return [
      { value: '1080p', label: 'HD 1080p', resolution: '1920x1080' },
      { value: '720p', label: 'HD 720p', resolution: '1280x720' },
      { value: '480p', label: 'SD 480p', resolution: '854x480' },
      { value: '360p', label: 'SD 360p', resolution: '640x360' },
      { value: '240p', label: 'Low 240p', resolution: '426x240' },
    ];
  }

  /**
   * Get supported video formats
   */
  static getSupportedFormats(): Array<{ extension: string; mimeType: string; description: string }> {
    return [
      { extension: '.mp4', mimeType: 'video/mp4', description: 'MP4 Video' },
      { extension: '.webm', mimeType: 'video/webm', description: 'WebM Video' },
      { extension: '.mov', mimeType: 'video/quicktime', description: 'QuickTime Movie' },
      { extension: '.avi', mimeType: 'video/x-msvideo', description: 'AVI Video' },
      { extension: '.mkv', mimeType: 'video/x-matroska', description: 'Matroska Video' },
    ];
  }

  /**
   * Extract video ID from various URL formats
   */
  static extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      
      // Try to find video ID in path segments
      for (let i = pathSegments.length - 1; i >= 0; i--) {
        const segment = pathSegments[i];
        if (segment && segment.length > 10) { // Assume video IDs are longer than 10 chars
          return segment.replace(/\.[^/.]+$/, ''); // Remove file extension
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance for convenience
export const videoSourceResolver = VideoSourceResolver;
export default VideoSourceResolver;
