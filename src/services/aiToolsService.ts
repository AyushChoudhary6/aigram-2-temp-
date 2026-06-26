import { apiService } from './api';
import { API_ENDPOINTS, DEBUG_CONFIG } from '../constants';
import {
  ApiResponse,
  AITool,
  AIToolCreateRequest,
  AIToolExecutionRequest,
  AIToolExecutionResponse,
  AIToolCostEstimate,
  GenericPromptRequest,
  GenericPromptResponse,
  FreeUsageCheck,
  PaginatedResponse,
} from '../types';

/**
 * AI Tools Service - Handles all AI tools-related API operations
 */
class AIToolsService {
  
  // AI Tools Management

  /**
   * Get list of AI tools with pagination
   */
  async getAITools(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${API_ENDPOINTS.AI_TOOLS.LIST}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🤖 Getting AI tools:', { page, size });
      }

      return await apiService.get<PaginatedResponse<AITool>>(url);
    } catch (error) {
      console.error('Error getting AI tools:', error);
      throw error;
    }
  }

  /**
   * Get AI tool by ID
   */
  async getAIToolById(toolId: string): Promise<ApiResponse<AITool>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.AI_TOOLS.DETAILS, { toolId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🤖 Getting AI tool by ID:', toolId);
      }

      return await apiService.get<AITool>(url);
    } catch (error) {
      console.error('Error getting AI tool by ID:', error);
      throw error;
    }
  }

  /**
   * Search AI tools (using POST method as per backend)
   */
  async searchAITools(searchTerm: string, visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC', page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    try {
      const searchData = {
        searchTerm,
        visibility,
        page,
        size
      };
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔍 Searching AI tools:', searchData);
      }

      return await apiService.post<PaginatedResponse<AITool>>(API_ENDPOINTS.AI_TOOLS.SEARCH, searchData);
    } catch (error) {
      console.error('Error searching AI tools:', error);
      throw error;
    }
  }

  /**
   * Get popular AI tools
   */
  async getPopularAITools(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${API_ENDPOINTS.AI_TOOLS.POPULAR}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔥 Getting popular AI tools:', { page, size });
      }

      return await apiService.get<PaginatedResponse<AITool>>(url);
    } catch (error) {
      console.error('Error getting popular AI tools:', error);
      throw error;
    }
  }

  // AI Tool Creation and Management

  /**
   * Create new AI tool
   */
  async createAITool(toolData: AIToolCreateRequest): Promise<ApiResponse<AITool>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🛠️ Creating AI tool:', toolData);
      }

      return await apiService.post<AITool>(API_ENDPOINTS.AI_TOOLS.CREATE, toolData);
    } catch (error) {
      console.error('Error creating AI tool:', error);
      throw error;
    }
  }

  /**
   * Update AI tool
   */
  async updateAITool(toolId: string, updates: Partial<AIToolCreateRequest>): Promise<ApiResponse<AITool>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.AI_TOOLS.UPDATE, { toolId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✏️ Updating AI tool:', toolId, updates);
      }

      return await apiService.put<AITool>(url, updates);
    } catch (error) {
      console.error('Error updating AI tool:', error);
      throw error;
    }
  }

  // AI Tool Execution

  /**
   * Execute AI tool
   */
  async executeAITool(toolId: string, executionData: AIToolExecutionRequest): Promise<ApiResponse<AIToolExecutionResponse>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.AI_TOOLS.EXECUTE, { toolId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('⚡ Executing AI tool:', toolId, executionData);
      }

      return await apiService.post<AIToolExecutionResponse>(url, executionData);
    } catch (error) {
      console.error('Error executing AI tool:', error);
      throw error;
    }
  }

  /**
   * Get cost estimate for AI tool execution
   */
  async getAIToolCostEstimate(toolId: string, inputPrompt: string): Promise<ApiResponse<AIToolCostEstimate>> {
    try {
      const url = apiService.replaceUrlParams(API_ENDPOINTS.AI_TOOLS.ESTIMATE_COST, { toolId });
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('💰 Getting cost estimate:', toolId, inputPrompt);
      }

      return await apiService.post<AIToolCostEstimate>(url, { inputPrompt });
    } catch (error) {
      console.error('Error getting cost estimate:', error);
      throw error;
    }
  }

  /**
   * Get AI tool usage history
   */
  async getUsageHistory(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<AIToolExecutionResponse>>> {
    try {
      const queryString = apiService.buildQueryString({ page, size });
      const url = `${API_ENDPOINTS.AI_TOOLS.USAGE_HISTORY}${queryString}`;
      
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📊 Getting usage history:', { page, size });
      }

      return await apiService.get<PaginatedResponse<AIToolExecutionResponse>>(url);
    } catch (error) {
      console.error('Error getting usage history:', error);
      throw error;
    }
  }

  // Generic Prompt Execution

  /**
   * Execute generic prompt
   */
  async executeGenericPrompt(promptData: GenericPromptRequest): Promise<ApiResponse<GenericPromptResponse>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('💭 Executing generic prompt:', promptData);
      }

      return await apiService.post<GenericPromptResponse>(API_ENDPOINTS.AI_TOOLS.GENERIC_PROMPT, promptData);
    } catch (error) {
      console.error('Error executing generic prompt:', error);
      throw error;
    }
  }

  /**
   * Check free usage for generic prompts
   */
  async checkFreeUsage(): Promise<ApiResponse<FreeUsageCheck>> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🆓 Checking free usage');
      }

      return await apiService.get<FreeUsageCheck>(API_ENDPOINTS.AI_TOOLS.FREE_USAGE_CHECK);
    } catch (error) {
      console.error('Error checking free usage:', error);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Validate AI tool JSON schema
   */
  validateJsonSchema(schema: string): { isValid: boolean; error?: string } {
    try {
      const parsed = JSON.parse(schema);
      
      // Basic validation for required fields
      if (!parsed.type || parsed.type !== 'object') {
        return { isValid: false, error: 'Schema must be of type "object"' };
      }
      
      if (!parsed.properties || typeof parsed.properties !== 'object') {
        return { isValid: false, error: 'Schema must have "properties" field' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Estimate token count for prompt
   */
  estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate estimated cost
   */
  calculateEstimatedCost(tokenCount: number, model: string): number {
    // Rough cost estimation based on model
    const costPerToken = {
      'gpt-3.5-turbo': 0.000002, // $0.002 per 1K tokens
      'gpt-4': 0.00003, // $0.03 per 1K tokens
    };
    
    const rate = costPerToken[model as keyof typeof costPerToken] || costPerToken['gpt-3.5-turbo'];
    return tokenCount * rate;
  }

  /**
   * Format cost in user-friendly way
   */
  formatCost(cost: number, currency: string = 'USD'): string {
    if (cost < 0.01) {
      return `< $0.01`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);
  }

  /**
   * Get AI tool categories
   */
  getAIToolCategories(): string[] {
    return [
      'TEXT_GENERATION',
      'TEXT_PROCESSING',
      'CODE_GENERATION',
      'IMAGE_PROCESSING',
      'DATA_ANALYSIS',
      'TRANSLATION',
      'SUMMARIZATION',
      'QUESTION_ANSWERING',
    ];
  }

  /**
   * Get supported AI models
   */
  getSupportedModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most tasks'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'More capable but slower and more expensive'
      },
    ];
  }

  /**
   * Validate prompt input
   */
  validatePromptInput(prompt: string): { isValid: boolean; error?: string } {
    if (!prompt || prompt.trim().length === 0) {
      return { isValid: false, error: 'Prompt cannot be empty' };
    }
    
    if (prompt.length > 10000) {
      return { isValid: false, error: 'Prompt is too long (max 10,000 characters)' };
    }
    
    return { isValid: true };
  }

  /**
   * Generate example JSON schema
   */
  generateExampleSchema(): string {
    return JSON.stringify({
      type: 'object',
      properties: {
        input_text: {
          type: 'string',
          description: 'The text to process'
        },
        style: {
          type: 'string',
          enum: ['formal', 'casual', 'technical'],
          description: 'The writing style to use'
        },
        max_length: {
          type: 'number',
          minimum: 1,
          maximum: 1000,
          description: 'Maximum length of the output'
        }
      },
      required: ['input_text']
    }, null, 2);
  }

  /**
   * Parse AI tool execution result
   */
  parseExecutionResult(result: string): { success: boolean; data?: any; error?: string } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(result);
      return { success: true, data: parsed };
    } catch {
      // If not JSON, return as plain text
      return { success: true, data: { text: result } };
    }
  }

  /**
   * Format execution time
   */
  formatExecutionTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }
}

// Create and export singleton instance
export const aiToolsService = new AIToolsService();
export default aiToolsService;
