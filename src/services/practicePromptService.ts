import { apiService } from './api';
import { API_ENDPOINTS, DEBUG_CONFIG } from '../constants';
import {
  ApiResponse,
  Question,
  QuestionCreateRequest,
  Submission,
  SubmissionRequest,
  UserStatistics,
  LeaderboardEntry,
  PracticeMetadata,
  PaginatedResponse,
} from '../types';

/**
 * Practice Prompt Service - Handles all practice prompt/learning-related API operations
 * Focused specifically on practice-prompt endpoints and functionality
 */
class PracticePromptService {
  
  // Questions Management

  /**
   * Get list of questions with pagination and filters
   */
  async getQuestions(
    page: number = 0,
    size: number = 20,
    difficulty?: string,
    category?: string,
    tags?: string[]
  ): Promise<ApiResponse<PaginatedResponse<Question>>> {
    try {
      const params: any = { page, size };
      if (difficulty) params.difficulty = difficulty;
      if (category) params.category = category;
      if (tags && tags.length > 0) params.tags = tags.join(',');

      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.QUESTIONS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📚 Getting practice prompt questions:', params);
      }

      return await apiService.get<PaginatedResponse<Question>>(url);
    } catch (error) {
      console.error('Error getting practice prompt questions:', error);
      throw error;
    }
  }

  /**
   * Get question by ID
   */
  async getQuestionById(questionId: string): Promise<ApiResponse<Question>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.PRACTICE.QUESTION_DETAILS, { questionId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📚 Getting practice prompt question by ID:', questionId);
      }

      return await apiService.get<Question>(url);
    } catch (error) {
      console.error('Error getting practice prompt question by ID:', error);
      throw error;
    }
  }

  /**
   * Create new question (for admins/contributors)
   */
  async createQuestion(questionData: QuestionCreateRequest): Promise<ApiResponse<Question>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('➕ Creating practice prompt question:', questionData);
      }

      return await apiService.post<Question>(API_ENDPOINTS.PRACTICE.QUESTIONS, questionData);
    } catch (error) {
      console.error('Error creating practice prompt question:', error);
      throw error;
    }
  }

  /**
   * Get questions by author
   */
  async getQuestionsByAuthor(
    authorId: string,
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Question>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = apiService.replaceUrlParams(API_ENDPOINTS.PRACTICE.QUESTIONS_BY_AUTHOR, { authorId });
      const fullUrl = `${url}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('👤 Getting practice prompt questions by author:', authorId, params);
      }

      return await apiService.get<PaginatedResponse<Question>>(fullUrl);
    } catch (error) {
      console.error('Error getting practice prompt questions by author:', error);
      throw error;
    }
  }

  /**
   * Get popular questions
   */
  async getPopularQuestions(
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Question>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.POPULAR_QUESTIONS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔥 Getting popular practice prompt questions:', params);
      }

      return await apiService.get<PaginatedResponse<Question>>(url);
    } catch (error) {
      console.error('Error getting popular practice prompt questions:', error);
      throw error;
    }
  }

  /**
   * Get top-rated questions
   */
  async getTopRatedQuestions(
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Question>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.TOP_RATED_QUESTIONS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('⭐ Getting top-rated practice prompt questions:', params);
      }

      return await apiService.get<PaginatedResponse<Question>>(url);
    } catch (error) {
      console.error('Error getting top-rated practice prompt questions:', error);
      throw error;
    }
  }

  // Submissions Management

  /**
   * Submit solution for a question
   */
  async submitSolution(submissionData: SubmissionRequest): Promise<ApiResponse<Submission>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📝 Submitting practice prompt solution:', submissionData);
      }

      return await apiService.post<Submission>(API_ENDPOINTS.PRACTICE.SUBMISSIONS, submissionData);
    } catch (error) {
      console.error('Error submitting practice prompt solution:', error);
      throw error;
    }
  }

  /**
   * Get user's submissions
   */
  async getMySubmissions(
    page: number = 0,
    size: number = 20,
    questionId?: string,
    status?: string
  ): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    try {
      const params: any = { page, size };
      if (questionId) params.questionId = questionId;
      if (status) params.status = status;

      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.MY_SUBMISSIONS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting my practice prompt submissions:', params);
      }

      return await apiService.get<PaginatedResponse<Submission>>(url);
    } catch (error) {
      console.error('Error getting my practice prompt submissions:', error);
      throw error;
    }
  }

  /**
   * Get all submissions (for admins)
   */
  async getAllSubmissions(
    page: number = 0,
    size: number = 20,
    userId?: string,
    questionId?: string
  ): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    try {
      const params: any = { page, size };
      if (userId) params.userId = userId;
      if (questionId) params.questionId = questionId;

      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.SUBMISSIONS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting all practice prompt submissions:', params);
      }

      return await apiService.get<PaginatedResponse<Submission>>(url);
    } catch (error) {
      console.error('Error getting all practice prompt submissions:', error);
      throw error;
    }
  }

  /**
   * Get submissions for a specific question
   */
  async getSubmissionsByQuestion(questionId: string): Promise<ApiResponse<Submission[]>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.PRACTICE.SUBMISSIONS_BY_QUESTION, { questionId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📝 Getting practice prompt submissions by question:', questionId);
      }

      return await apiService.get<Submission[]>(url);
    } catch (error) {
      console.error('Error getting practice prompt submissions by question:', error);
      throw error;
    }
  }

  // Statistics and Leaderboard

  /**
   * Get user's practice statistics
   */
  async getMyStatistics(): Promise<ApiResponse<UserStatistics>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📈 Getting my practice prompt statistics');
      }

      return await apiService.get<UserStatistics>(API_ENDPOINTS.PRACTICE.STATISTICS);
    } catch (error) {
      console.error('Error getting my practice prompt statistics:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    page: number = 0,
    size: number = 20,
    timeframe: 'all' | 'month' | 'week' = 'all'
  ): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> {
    try {
      const params = { page, size, timeframe };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.LEADERBOARD}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🏆 Getting practice prompt leaderboard:', params);
      }

      return await apiService.get<PaginatedResponse<LeaderboardEntry>>(url);
    } catch (error) {
      console.error('Error getting practice prompt leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting practice prompt user dashboard');
      }

      return await apiService.get<any>(API_ENDPOINTS.PRACTICE.USER_DASHBOARD);
    } catch (error) {
      console.error('Error getting practice prompt user dashboard:', error);
      throw error;
    }
  }

  /**
   * Get enhanced user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStatistics>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📈 Getting enhanced practice prompt user stats');
      }

      return await apiService.get<UserStatistics>(API_ENDPOINTS.PRACTICE.USER_STATS);
    } catch (error) {
      console.error('Error getting enhanced practice prompt user stats:', error);
      throw error;
    }
  }

  /**
   * Get user submission history
   */
  async getUserHistory(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.USER_HISTORY}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📚 Getting practice prompt user history:', params);
      }

      return await apiService.get<PaginatedResponse<Submission>>(url);
    } catch (error) {
      console.error('Error getting practice prompt user history:', error);
      throw error;
    }
  }

  /**
   * Get daily activity data
   */
  async getDailyActivity(days: number = 30): Promise<ApiResponse<any>> {
    try {
      const params = { days };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.DAILY_ACTIVITY}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📅 Getting practice prompt daily activity:', { days });
      }

      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error getting practice prompt daily activity:', error);
      throw error;
    }
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.GLOBAL_LEADERBOARD}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🌍 Getting practice prompt global leaderboard:', params);
      }

      return await apiService.get<PaginatedResponse<LeaderboardEntry>>(url);
    } catch (error) {
      console.error('Error getting practice prompt global leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user ranking
   */
  async getUserRanking(): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🏅 Getting practice prompt user ranking');
      }

      return await apiService.get<any>(API_ENDPOINTS.PRACTICE.USER_RANKING);
    } catch (error) {
      console.error('Error getting practice prompt user ranking:', error);
      throw error;
    }
  }

  /**
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.WEEKLY_LEADERBOARD}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📅 Getting practice prompt weekly leaderboard:', params);
      }

      return await apiService.get<PaginatedResponse<LeaderboardEntry>>(url);
    } catch (error) {
      console.error('Error getting practice prompt weekly leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get category leaderboard
   */
  async getCategoryLeaderboard(
    category: string,
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = apiService.replaceUrlParams(API_ENDPOINTS.PRACTICE.CATEGORY_LEADERBOARD, { category });
      const fullUrl = `${url}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🏷️ Getting practice prompt category leaderboard:', category, params);
      }

      return await apiService.get<PaginatedResponse<LeaderboardEntry>>(fullUrl);
    } catch (error) {
      console.error('Error getting practice prompt category leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get practice metadata (categories, tags, difficulties)
   */
  async getPracticeMetadata(): Promise<ApiResponse<PracticeMetadata>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔧 Getting practice prompt metadata');
      }

      return await apiService.get<PracticeMetadata>(API_ENDPOINTS.PRACTICE.METADATA);
    } catch (error) {
      console.error('Error getting practice prompt metadata:', error);
      throw error;
    }
  }

  // Admin Methods

  /**
   * Get pending reviews (Admin only)
   */
  async getAdminPendingReviews(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<Question>>> {
    try {
      const params = { page, size };
      const queryString = apiService.buildQueryString(params);
      const url = `${API_ENDPOINTS.PRACTICE.ADMIN_PENDING_REVIEWS}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('👨‍💼 Getting practice prompt pending reviews:', params);
      }

      return await apiService.get<PaginatedResponse<Question>>(url);
    } catch (error) {
      console.error('Error getting practice prompt pending reviews:', error);
      throw error;
    }
  }

  /**
   * Review question (Admin only)
   */
  async reviewQuestion(reviewData: {
    questionId: string;
    status: 'APPROVED' | 'REJECTED';
    feedback?: string;
    difficulty?: string;
  }): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✅ Reviewing practice prompt question:', reviewData);
      }

      return await apiService.post<any>(API_ENDPOINTS.PRACTICE.ADMIN_REVIEW, reviewData);
    } catch (error) {
      console.error('Error reviewing practice prompt question:', error);
      throw error;
    }
  }

  /**
   * Get review statistics (Admin only)
   */
  async getAdminReviewStats(): Promise<ApiResponse<any>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting practice prompt admin review stats');
      }

      return await apiService.get<any>(API_ENDPOINTS.PRACTICE.ADMIN_REVIEW_STATS);
    } catch (error) {
      console.error('Error getting practice prompt admin review stats:', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Validate code solution
   */
  validateCodeSolution(code: string, language: string): { isValid: boolean; error?: string } {
    if (!code || code.trim().length === 0) {
      return { isValid: false, error: 'Code cannot be empty' };
    }

    if (code.length > 50000) {
      return { isValid: false, error: 'Code is too long (max 50,000 characters)' };
    }

    // Basic language-specific validation
    switch (language.toLowerCase()) {
      case 'javascript':
        if (!code.includes('function') && !code.includes('=>') && !code.includes('const') && !code.includes('let')) {
          return { isValid: false, error: 'JavaScript code should contain function definitions or variable declarations' };
        }
        break;
      case 'python':
        if (!code.includes('def ') && !code.includes('class ') && !code.includes('=')) {
          return { isValid: false, error: 'Python code should contain function definitions, classes, or assignments' };
        }
        break;
      case 'java':
        if (!code.includes('class ') && !code.includes('public ')) {
          return { isValid: false, error: 'Java code should contain class or method definitions' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Get supported programming languages
   */
  getSupportedLanguages(): Array<{ id: string; name: string; extension: string }> {
    return [
      { id: 'javascript', name: 'JavaScript', extension: '.js' },
      { id: 'python', name: 'Python', extension: '.py' },
      { id: 'java', name: 'Java', extension: '.java' },
      { id: 'cpp', name: 'C++', extension: '.cpp' },
      { id: 'c', name: 'C', extension: '.c' },
      { id: 'typescript', name: 'TypeScript', extension: '.ts' },
    ];
  }

  /**
   * Get difficulty levels
   */
  getDifficultyLevels(): Array<{ id: string; name: string; color: string }> {
    return [
      { id: 'EASY', name: 'Easy', color: '#22c55e' },
      { id: 'MEDIUM', name: 'Medium', color: '#f59e0b' },
      { id: 'HARD', name: 'Hard', color: '#ef4444' },
    ];
  }

  /**
   * Format submission status
   */
  formatSubmissionStatus(status: string): { label: string; color: string } {
    switch (status) {
      case 'CORRECT':
        return { label: 'Accepted', color: '#22c55e' };
      case 'INCORRECT':
        return { label: 'Wrong Answer', color: '#ef4444' };
      case 'PARTIAL':
        return { label: 'Partially Correct', color: '#f59e0b' };
      case 'TIMEOUT':
        return { label: 'Time Limit Exceeded', color: '#6b7280' };
      case 'RUNTIME_ERROR':
        return { label: 'Runtime Error', color: '#dc2626' };
      case 'COMPILE_ERROR':
        return { label: 'Compilation Error', color: '#7c2d12' };
      default:
        return { label: 'Unknown', color: '#6b7280' };
    }
  }

  /**
   * Calculate accuracy percentage
   */
  calculateAccuracy(correctSubmissions: number, totalSubmissions: number): number {
    if (totalSubmissions === 0) return 0;
    return Math.round((correctSubmissions / totalSubmissions) * 100);
  }

  /**
   * Format execution time
   */
  formatExecutionTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    }
  }

  /**
   * Format memory usage
   */
  formatMemoryUsage(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
  }

  /**
   * Generate code template for language
   */
  generateCodeTemplate(language: string, functionName: string = 'solution'): string {
    switch (language.toLowerCase()) {
      case 'javascript':
        return `function ${functionName}() {
    // Your code here
    
}`;
      case 'python':
        return `def ${functionName}():
    # Your code here
    pass`;
      case 'java':
        return `public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`;
      case 'cpp':
        return `#include <iostream>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`;
      case 'c':
        return `#include <stdio.h>

int main() {
    // Your code here
    
    return 0;
}`;
      case 'typescript':
        return `function ${functionName}(): void {
    // Your code here
    
}`;
      default:
        return '// Your code here';
    }
  }

  /**
   * Parse test case results
   */
  parseTestCaseResults(feedback: string): Array<{ input: string; expected: string; actual: string; passed: boolean }> {
    try {
      // Try to parse structured feedback
      const parsed = JSON.parse(feedback);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not structured, return empty array
    }
    return [];
  }

  /**
   * Get question categories
   */
  getQuestionCategories(): string[] {
    return [
      'Arrays',
      'Strings',
      'Linked Lists',
      'Trees',
      'Graphs',
      'Dynamic Programming',
      'Sorting',
      'Searching',
      'Hash Tables',
      'Stacks',
      'Queues',
      'Recursion',
      'Greedy',
      'Math',
      'Bit Manipulation',
    ];
  }

  /**
   * Estimate solution complexity
   */
  estimateComplexity(code: string): { time: string; space: string } {
    // Simple heuristic-based complexity estimation
    const nestedLoops = (code.match(/for|while/g) || []).length;
    const recursiveCalls = (code.match(/return.*\(/g) || []).length;
    const dataStructures = (code.match(/new |\.push|\.pop|Map|Set/g) || []).length;

    let timeComplexity = 'O(1)';
    let spaceComplexity = 'O(1)';

    if (nestedLoops >= 2) {
      timeComplexity = 'O(n²)';
    } else if (nestedLoops >= 1 || recursiveCalls > 0) {
      timeComplexity = 'O(n)';
    }

    if (recursiveCalls > 0) {
      spaceComplexity = 'O(n)';
    } else if (dataStructures > 0) {
      spaceComplexity = 'O(n)';
    }

    return { time: timeComplexity, space: spaceComplexity };
  }
}

// Create and export singleton instance
export const practicePromptService = new PracticePromptService();
export default practicePromptService;
