import { apiService } from './api';
import { API_ENDPOINTS, DEBUG_CONFIG } from '../constants';
import { VideoSourceResolver, VideoSourceData } from '../utils/videoSourceResolver';
import {
  ApiResponse,
  PaginatedResponse,
} from '../types';

/**
 * Video Practice Level Interface
 */
export interface VideoLevel {
  id: number;
  level_number: number;
  title: string;
  description: string;
  goal: string;
  hint: string;
  proof_type: string[];
  xp_reward: number;
  skill_category: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  prerequisites?: number[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * User Video Progress Interface
 */
export interface UserVideoProgress {
  id: string;
  user_id: string;
  level_id: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'completed' | 'failed';
  score: number | null;
  ai_feedback: string | null;
  video_proof_url?: string;
  prompt_description?: string;
  started_at?: string;
  completed_at?: string;
  submission_count: number;
  max_attempts: number;
}

/**
 * Video Submission Request Interface
 */
export interface VideoSubmissionRequest {
  level_id: number;
  video_file: File | Blob;
  prompt_description: string;
  approach_explanation?: string;
  metadata?: {
    duration: number;
    file_size: number;
    file_type: string;
  };
}

/**
 * AI Evaluation Response Interface
 */
export interface AIEvaluationResponse {
  canProceed: boolean;
  score: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  next_steps?: string[];
}

/**
 * Video Practice Statistics Interface
 */
export interface VideoStatistics {
  total_levels: number;
  completed_levels: number;
  in_progress_levels: number;
  total_xp_earned: number;
  average_score: number;
  completion_rate: number;
  streak_days: number;
  total_videos_submitted: number;
  categories_mastered: string[];
  skill_breakdown: Record<string, {
    completed: number;
    total: number;
    average_score: number;
  }>;
}

/**
 * Video Leaderboard Entry Interface
 */
export interface VideoLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  total_xp: number;
  completed_levels: number;
  average_score: number;
  rank: number;
  streak_days: number;
  badges?: string[];
}

/**
 * Practice Video Service - Handles all video practice-related API operations
 * Focused specifically on video-based learning and practice functionality
 */
class PracticeVideoService {
  
  // Video Levels Management

  /**
   * Generate video thumbnail (cross-platform)
   */
  async generateVideoThumbnail(videoFile: any): Promise<string> {
    // For cross-platform compatibility, return a placeholder or use platform-specific implementation
    if (typeof window !== 'undefined' && window.document) {
      // Web implementation
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          video.currentTime = 1; // Seek to 1 second
        };

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
            resolve(thumbnail);
          } else {
            reject(new Error('Canvas context not available'));
          }
        };

        video.onerror = () => reject(new Error('Failed to load video'));
        video.src = URL.createObjectURL(videoFile);
      });
    } else {
      // React Native implementation (would use expo-av or react-native-video)
      console.log('Video thumbnail generation not implemented for React Native');
      return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
  }

  /**
   * Get video question by ID (updated to match backend API)
   */
  async getVideoQuestionById(questionId: string): Promise<ApiResponse<any>> {
    try {
      const url = apiService.replaceUrlParams('/practice-video/questions/{questionId}', { questionId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎥 Getting video practice question by ID:', questionId);
      }

      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error getting video practice question by ID:', error);
      throw error;
    }
  }

  /**
   * Get video stream URL for practice video questions
   */
  async getVideoStreamUrl(questionId: string, quality: string = '720p'): Promise<ApiResponse<{ streamUrl: string; videoPath?: string; isLocal?: boolean; isCloud?: boolean; provider?: string }>> {
    try {
      // First get video question details to check for video URL/path
      const questionDetails = await this.getVideoQuestionById(questionId);
      
      if (questionDetails.success && questionDetails.data) {
        const question = questionDetails.data;
        
        // Use unified video source resolver
        const videoSourceData: VideoSourceData = {
          videoUrl: question.videoUrl || question.video_url,
          videoPath: question.videoPath || question.video_path,
          streamUrl: question.streamUrl || question.stream_url
        };
        
        const resolvedSource = await VideoSourceResolver.resolveVideoSource(videoSourceData, questionId, quality);
        
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
      
      // Fallback to backend streaming endpoint if question details not available
      const streamEndpoint = `/practice-video/questions/${questionId}/stream`;
      const backendStreamUrl = `${apiService.getBaseUrl()}${streamEndpoint}?quality=${quality}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎬 Using practice video streaming endpoint fallback:', backendStreamUrl);
      }

      return {
        success: true,
        message: 'Using practice video streaming endpoint',
        data: {
          streamUrl: backendStreamUrl,
          isLocal: false,
          isCloud: false
        }
      };
    } catch (error) {
      console.error('Error getting practice video stream URL:', error);
      
      // Final fallback to sample video
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🎬 Using fallback sample video for practice');
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
   * Search video questions (backend integration)
   */
  async searchVideoQuestions(params: {
    searchTerm?: string;
    category?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    page?: number;
    size?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const queryString = apiService.buildQueryString(params);
      const url = `/practice-video/questions${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔍 Searching video practice questions:', params);
      }

      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error searching video practice questions:', error);
      throw error;
    }
  }

  /**
   * Get popular video questions
   */
  async getPopularVideoQuestions(page: number = 0, size: number = 10): Promise<ApiResponse<any>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `/practice-video/questions/popular${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔥 Getting popular video practice questions');
      }

      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error getting popular video practice questions:', error);
      throw error;
    }
  }

  /**
   * Get video questions by category
   */
  async getVideoQuestionsByCategory(category: string, page: number = 0, size: number = 10): Promise<ApiResponse<any>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `/practice-video/questions/category/${category}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📂 Getting video questions by category:', category);
      }

      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error getting video questions by category:', error);
      throw error;
    }
  }

  /**
   * Get video questions by difficulty
   */
  async getVideoQuestionsByDifficulty(difficulty: 'EASY' | 'MEDIUM' | 'HARD', page: number = 0, size: number = 10): Promise<ApiResponse<any>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `/practice-video/questions/difficulty/${difficulty}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('⚡ Getting video questions by difficulty:', difficulty);
      }

      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error getting video questions by difficulty:', error);
      throw error;
    }
  }

  /**
   * Create video question (backend integration)
   */
  async createVideoQuestion(questionData: {
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category: string;
    tags: string[];
    maxScore?: number;
    timeLimit?: number;
  }): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('➕ Creating video practice question:', questionData);
      }

      return await apiService.post<any>('/practice-video/questions', questionData);
    } catch (error) {
      console.error('Error creating video practice question:', error);
      throw error;
    }
  }

  /**
   * Update video question (backend integration)
   */
  async updateVideoQuestion(questionId: string, updates: {
    title?: string;
    description?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    category?: string;
    tags?: string[];
  }): Promise<ApiResponse<any>> {
    try {
      const url = apiService.replaceUrlParams('/practice-video/questions/{questionId}', { questionId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✏️ Updating video practice question:', questionId, updates);
      }

      return await apiService.put<any>(url, updates);
    } catch (error) {
      console.error('Error updating video practice question:', error);
      throw error;
    }
  }

  /**
   * Get user's video practice progress
   */
  async getUserVideoProgress(userId?: string): Promise<ApiResponse<Record<number, UserVideoProgress>>> {
    try {
      const url = userId 
        ? apiService.replaceUrlParams(API_ENDPOINTS.PRACTICE.USER_VIDEO_PROGRESS, { userId })
        : API_ENDPOINTS.PRACTICE.MY_VIDEO_PROGRESS;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting user video practice progress:', userId || 'current user');
      }

      const response = await apiService.get<UserVideoProgress[]>(url);
      
      // Convert array to map for easier lookup
      const progressMap: Record<number, UserVideoProgress> = {};
      if (response.success && response.data) {
        response.data.forEach((progress) => {
          progressMap[progress.level_id] = progress;
        });
      }

      return {
        ...response,
        data: progressMap
      };
    } catch (error) {
      console.error('Error getting user video practice progress:', error);
      throw error;
    }
  }

  /**
   * Get video levels grouped by sections/categories
   */
  async getVideoLevelsSections(): Promise<ApiResponse<{
    sections: Array<{
      title: string;
      subtitle: string;
      levels: VideoLevel[];
    }>;
  }>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📚 Getting video levels sections');
      }

      return await apiService.get<{
        sections: Array<{
          title: string;
          subtitle: string;
          levels: VideoLevel[];
        }>;
      }>(API_ENDPOINTS.PRACTICE.VIDEO_SECTIONS);
    } catch (error) {
      console.error('Error getting video levels sections:', error);
      throw error;
    }
  }

  // Video Submissions Management

  /**
   * Submit video response (updated to match backend API)
   */
  async submitVideoResponse(submissionData: {
    questionId: string;
    files: File[];
    description: string;
  }): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📤 Submitting video response for question:', submissionData.questionId);
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('questionId', submissionData.questionId);
      formData.append('description', submissionData.description);
      
      // Append multiple files
      submissionData.files.forEach((file, index) => {
        formData.append('files', file);
      });

      return await apiService.postFormData<any>('/practice-video/submissions', formData);
    } catch (error) {
      console.error('Error submitting video response:', error);
      throw error;
    }
  }

  /**
   * Submit video proof for a level (legacy method for backward compatibility)
   */
  async submitVideoProof(submissionData: VideoSubmissionRequest): Promise<ApiResponse<{
    submission_id: string;
    evaluation: AIEvaluationResponse;
  }>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📤 Submitting video proof for level:', submissionData.level_id);
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('level_id', submissionData.level_id.toString());
      formData.append('video_file', submissionData.video_file);
      formData.append('prompt_description', submissionData.prompt_description);
      
      if (submissionData.approach_explanation) {
        formData.append('approach_explanation', submissionData.approach_explanation);
      }
      
      if (submissionData.metadata) {
        formData.append('metadata', JSON.stringify(submissionData.metadata));
      }

      return await apiService.postFormData<{
        submission_id: string;
        evaluation: AIEvaluationResponse;
      }>(API_ENDPOINTS.PRACTICE.VIDEO_SUBMISSIONS, formData);
    } catch (error) {
      console.error('Error submitting video proof:', error);
      throw error;
    }
  }

  /**
   * Get user's video submissions
   */
  async getMyVideoSubmissions(
    page: number = 0,
    size: number = 20,
    levelId?: number,
    status?: string
  ): Promise<ApiResponse<PaginatedResponse<UserVideoProgress>>> {
    try {
      const params: any = { page, size };
      if (levelId) params.levelId = levelId;
      if (status) params.status = status;

      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.MY_VIDEO_SUBMISSIONS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting my video submissions:', params);
      }

      return await apiService.get<PaginatedResponse<UserVideoProgress>>(url);
    } catch (error) {
      console.error('Error getting my video submissions:', error);
      throw error;
    }
  }

  /**
   * Retry submission for a level
   */
  async retryVideoSubmission(levelId: number): Promise<ApiResponse<{ can_retry: boolean; attempts_remaining: number }>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔄 Retrying video submission for level:', levelId);
      }

      return await apiService.post<{ can_retry: boolean; attempts_remaining: number }>(
        API_ENDPOINTS.PRACTICE.RETRY_VIDEO_SUBMISSION,
        { level_id: levelId }
      );
    } catch (error) {
      console.error('Error retrying video submission:', error);
      throw error;
    }
  }

  // Statistics and Leaderboard

  /**
   * Get user's video practice statistics
   */
  async getVideoStatistics(): Promise<ApiResponse<VideoStatistics>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📈 Getting video practice statistics');
      }

      return await apiService.get<VideoStatistics>(API_ENDPOINTS.PRACTICE.VIDEO_STATISTICS);
    } catch (error) {
      console.error('Error getting video practice statistics:', error);
      throw error;
    }
  }

  /**
   * Get video practice leaderboard
   */
  async getVideoLeaderboard(
    page: number = 0,
    size: number = 20,
    timeframe: 'all' | 'month' | 'week' = 'all',
    category?: string
  ): Promise<ApiResponse<PaginatedResponse<VideoLeaderboardEntry>>> {
    try {
      const params: any = { page, size, timeframe };
      if (category) params.category = category;

      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.VIDEO_LEADERBOARD}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🏆 Getting video practice leaderboard:', params);
      }

      return await apiService.get<PaginatedResponse<VideoLeaderboardEntry>>(url);
    } catch (error) {
      console.error('Error getting video practice leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user's video practice ranking
   */
  async getVideoRanking(): Promise<ApiResponse<{
    global_rank: number;
    category_ranks: Record<string, number>;
    percentile: number;
    total_users: number;
  }>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🏅 Getting video practice ranking');
      }

      return await apiService.get<{
        global_rank: number;
        category_ranks: Record<string, number>;
        percentile: number;
        total_users: number;
      }>(API_ENDPOINTS.PRACTICE.VIDEO_RANKING);
    } catch (error) {
      console.error('Error getting video practice ranking:', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Validate video file before upload
   */
  validateVideoFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Video file must be under 100MB' };
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only MP4, WebM, MOV, and AVI video formats are supported' };
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      return { isValid: false, error: 'Video file must have a valid name' };
    }

    return { isValid: true };
  }

  /**
   * Get supported video formats
   */
  getSupportedVideoFormats(): Array<{ extension: string; mimeType: string; description: string }> {
    return [
      { extension: '.mp4', mimeType: 'video/mp4', description: 'MP4 Video' },
      { extension: '.webm', mimeType: 'video/webm', description: 'WebM Video' },
      { extension: '.mov', mimeType: 'video/quicktime', description: 'QuickTime Movie' },
      { extension: '.avi', mimeType: 'video/x-msvideo', description: 'AVI Video' },
    ];
  }

  /**
   * Get skill categories for video practice
   */
  getSkillCategories(): Array<{ id: string; name: string; description: string; icon: string }> {
    return [
      { id: 'prompting', name: 'AI Prompting', description: 'Master the art of AI communication', icon: 'zap' },
      { id: 'automation', name: 'AI Automation', description: 'Build automated AI workflows', icon: 'flame' },
      { id: 'creation', name: 'AI Creation', description: 'Create content with AI tools', icon: 'crown' },
      { id: 'analysis', name: 'AI Analysis', description: 'Analyze data using AI', icon: 'trophy' },
      { id: 'integration', name: 'AI Integration', description: 'Integrate AI into applications', icon: 'brain' },
      { id: 'optimization', name: 'AI Optimization', description: 'Optimize AI performance', icon: 'star' },
    ];
  }

  /**
   * Get difficulty levels
   */
  getDifficultyLevels(): Array<{ id: string; name: string; color: string; description: string }> {
    return [
      { id: 'EASY', name: 'Beginner', color: '#22c55e', description: 'Perfect for getting started' },
      { id: 'MEDIUM', name: 'Intermediate', color: '#f59e0b', description: 'Build on your foundation' },
      { id: 'HARD', name: 'Advanced', color: '#ef4444', description: 'Master-level challenges' },
    ];
  }

  /**
   * Format video duration
   */
  formatVideoDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    }
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * Get level status based on progress
   */
  getLevelStatus(level: VideoLevel, progress?: UserVideoProgress): {
    status: 'available' | 'locked' | 'in_progress' | 'completed' | 'failed';
    canStart: boolean;
    canRetry: boolean;
  } {
    if (!progress) {
      return { status: 'available', canStart: true, canRetry: false };
    }

    const canRetry = progress.submission_count < progress.max_attempts && 
                    (progress.status === 'failed' || progress.status === 'submitted');

    switch (progress.status) {
      case 'completed':
        return { status: 'completed', canStart: false, canRetry: false };
      case 'in_progress':
      case 'submitted':
        return { status: 'in_progress', canStart: false, canRetry: canRetry };
      case 'failed':
        return { status: 'failed', canStart: false, canRetry: canRetry };
      default:
        return { status: 'available', canStart: true, canRetry: false };
    }
  }

  /**
   * Generate video practice tips
   */
  getVideoRecordingTips(): string[] {
    return [
      "🎥 Record in landscape mode for better viewing experience",
      "🔊 Ensure clear audio - explain your thought process",
      "💡 Show your screen clearly - avoid small text",
      "⏱️ Keep recordings focused - aim for 2-5 minutes",
      "🎯 Demonstrate the complete task from start to finish",
      "📝 Mention the prompt or approach you're using",
      "🔄 If you make mistakes, explain how you fix them",
      "✨ Highlight key insights or learnings",
    ];
  }

  /**
   * Get quirky section headings (matching reference project style)
   */
  getSectionHeadings(): Array<{ title: string; subtitle: string }> {
    return [
      { title: "🚀 Baby Steps to Brilliance", subtitle: "Start your AI journey here" },
      { title: "🔥 Level Up, Butter Cup", subtitle: "Things are getting spicy now" },
      { title: "⚡ Big Brain Energy Only", subtitle: "Flex those AI muscles" },
      { title: "👑 Boss Mode Activated", subtitle: "You're basically a wizard now" },
      { title: "🌟 Touch Grass After This", subtitle: "The final frontier of mastery" },
    ];
  }

  /**
   * Parse AI feedback for structured display
   */
  parseAIFeedback(feedback: string): {
    summary: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  } {
    try {
      // Try to parse structured feedback
      const parsed = JSON.parse(feedback);
      return {
        summary: parsed.summary || feedback,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        nextSteps: parsed.next_steps || [],
      };
    } catch {
      // If not structured, return simple format
      return {
        summary: feedback,
        strengths: [],
        improvements: [],
        nextSteps: [],
      };
    }
  }

}

// Create and export singleton instance
export const practiceVideoService = new PracticeVideoService();
export default practiceVideoService;
