import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../types';

export interface ErrorLog {
  id: string;
  timestamp: string;
  error: Error | ApiError | string;
  context: string;
  userId?: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableRemoteLogging: boolean;
  enableUserNotification: boolean;
  maxLogEntries: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class ErrorHandler {
  private config: ErrorHandlerConfig = {
    enableLogging: true,
    enableRemoteLogging: true,
    enableUserNotification: true,
    maxLogEntries: 100,
    logLevel: 'error',
  };

  private errorLogs: ErrorLog[] = [];
  private readonly STORAGE_KEY = 'aigram_error_logs';

  constructor(config?: Partial<ErrorHandlerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.loadErrorLogs();
  }

  /**
   * Handle different types of errors with appropriate responses
   */
  async handleError(
    error: Error | ApiError | string,
    context: string,
    severity: ErrorLog['severity'] = 'medium',
    userId?: string
  ): Promise<void> {
    try {
      const errorLog = this.createErrorLog(error, context, severity, userId);
      
      // Log the error
      if (this.config.enableLogging) {
        this.logError(errorLog);
      }

      // Store error locally
      await this.storeErrorLog(errorLog);

      // Send to remote logging service
      if (this.config.enableRemoteLogging) {
        await this.sendToRemoteLogging(errorLog);
      }

      // Show user notification if appropriate
      if (this.config.enableUserNotification && this.shouldNotifyUser(severity)) {
        this.showUserNotification(errorLog);
      }

    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
    }
  }

  /**
   * Handle API errors specifically
   */
  async handleApiError(
    apiError: ApiError,
    context: string,
    userId?: string
  ): Promise<void> {
    const severity = this.determineSeverityFromApiError(apiError);
    await this.handleError(apiError, context, severity, userId);
  }

  /**
   * Handle network errors
   */
  async handleNetworkError(
    error: Error,
    context: string,
    userId?: string
  ): Promise<void> {
    await this.handleError(error, `Network Error: ${context}`, 'high', userId);
  }

  /**
   * Handle authentication errors
   */
  async handleAuthError(
    error: Error | ApiError,
    context: string,
    userId?: string
  ): Promise<void> {
    await this.handleError(error, `Auth Error: ${context}`, 'high', userId);
  }

  /**
   * Handle payment errors
   */
  async handlePaymentError(
    error: Error | ApiError,
    context: string,
    userId?: string
  ): Promise<void> {
    await this.handleError(error, `Payment Error: ${context}`, 'critical', userId);
  }

  /**
   * Handle video upload errors
   */
  async handleVideoUploadError(
    error: Error | ApiError,
    context: string,
    userId?: string
  ): Promise<void> {
    await this.handleError(error, `Video Upload Error: ${context}`, 'medium', userId);
  }

  /**
   * Handle AI tool execution errors
   */
  async handleAIToolError(
    error: Error | ApiError,
    context: string,
    userId?: string
  ): Promise<void> {
    await this.handleError(error, `AI Tool Error: ${context}`, 'medium', userId);
  }

  /**
   * Create a standardized error log entry
   */
  private createErrorLog(
    error: Error | ApiError | string,
    context: string,
    severity: ErrorLog['severity'],
    userId?: string
  ): ErrorLog {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    let stackTrace: string | undefined;
    if (error instanceof Error) {
      stackTrace = error.stack;
    }

    return {
      id,
      timestamp,
      error,
      context,
      userId,
      stackTrace,
      severity,
      handled: true,
    };
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(errorLog: ErrorLog): void {
    const logMessage = `[${errorLog.severity.toUpperCase()}] ${errorLog.context}`;
    
    switch (errorLog.severity) {
      case 'critical':
        console.error(logMessage, errorLog.error);
        break;
      case 'high':
        console.error(logMessage, errorLog.error);
        break;
      case 'medium':
        console.warn(logMessage, errorLog.error);
        break;
      case 'low':
        console.info(logMessage, errorLog.error);
        break;
    }
  }

  /**
   * Store error log locally
   */
  private async storeErrorLog(errorLog: ErrorLog): Promise<void> {
    try {
      this.errorLogs.unshift(errorLog);
      
      // Keep only the most recent logs
      if (this.errorLogs.length > this.config.maxLogEntries) {
        this.errorLogs = this.errorLogs.slice(0, this.config.maxLogEntries);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorLogs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }
  }

  /**
   * Load error logs from storage
   */
  private async loadErrorLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedLogs) {
        this.errorLogs = JSON.parse(storedLogs);
      }
    } catch (loadError) {
      console.error('Failed to load error logs:', loadError);
    }
  }

  /**
   * Send error to remote logging service
   */
  private async sendToRemoteLogging(errorLog: ErrorLog): Promise<void> {
    try {
      // In production, this would send to a service like Sentry, LogRocket, etc.
      // For now, we'll just simulate the API call
      
      const payload = {
        ...errorLog,
        appVersion: '1.0.0',
        platform: 'mobile',
        environment: process.env.NODE_ENV || 'development',
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Error sent to remote logging:', payload.id);
    } catch (remoteError) {
      console.error('Failed to send error to remote logging:', remoteError);
    }
  }

  /**
   * Determine if user should be notified based on severity
   */
  private shouldNotifyUser(severity: ErrorLog['severity']): boolean {
    return severity === 'high' || severity === 'critical';
  }

  /**
   * Show user-friendly error notification
   */
  private showUserNotification(errorLog: ErrorLog): void {
    const userMessage = this.getUserFriendlyMessage(errorLog);
    
    Alert.alert(
      'Something went wrong',
      userMessage,
      [
        {
          text: 'OK',
          style: 'default',
        },
        {
          text: 'Report Issue',
          style: 'default',
          onPress: () => this.reportIssue(errorLog),
        },
      ]
    );
  }

  /**
   * Generate user-friendly error message
   */
  private getUserFriendlyMessage(errorLog: ErrorLog): string {
    const { context, severity } = errorLog;

    if (context.includes('Network Error')) {
      return 'Please check your internet connection and try again.';
    }

    if (context.includes('Auth Error')) {
      return 'There was an issue with authentication. Please try logging in again.';
    }

    if (context.includes('Payment Error')) {
      return 'There was an issue processing your payment. Please try again or contact support.';
    }

    if (context.includes('Video Upload Error')) {
      return 'There was an issue uploading your video. Please check your file and try again.';
    }

    if (context.includes('AI Tool Error')) {
      return 'The AI tool encountered an issue. Please try again in a moment.';
    }

    // Generic messages based on severity
    switch (severity) {
      case 'critical':
        return 'A critical error occurred. Please restart the app and contact support if the issue persists.';
      case 'high':
        return 'An error occurred that may affect your experience. Please try again.';
      case 'medium':
        return 'Something went wrong. Please try again.';
      case 'low':
        return 'A minor issue occurred. You can continue using the app.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Determine severity from API error
   */
  private determineSeverityFromApiError(apiError: ApiError): ErrorLog['severity'] {
    if (!apiError.statusCode) return 'medium';

    switch (apiError.statusCode) {
      case 401: // Unauthorized
      case 403: // Forbidden
        return 'high';
      case 404: // Not Found
        return 'medium';
      case 429: // Too Many Requests
        return 'medium';
      case 500: // Internal Server Error
      case 502: // Bad Gateway
      case 503: // Service Unavailable
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Report issue to support
   */
  private reportIssue(errorLog: ErrorLog): void {
    // In production, this would open a support ticket or feedback form
    console.log('Issue reported:', errorLog.id);
    
    Alert.alert(
      'Issue Reported',
      'Thank you for reporting this issue. Our team will investigate and work on a fix.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorLog['severity'], number>;
    recent: ErrorLog[];
  } {
    const bySeverity = this.errorLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorLog['severity'], number>);

    return {
      total: this.errorLogs.length,
      bySeverity,
      recent: this.errorLogs.slice(0, 10),
    };
  }

  /**
   * Clear error logs
   */
  async clearErrorLogs(): Promise<void> {
    try {
      this.errorLogs = [];
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  /**
   * Export error logs for debugging
   */
  exportErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// React Hook for error handling
export const useErrorHandler = () => {
  const handleError = (
    error: Error | ApiError | string,
    context: string,
    severity: ErrorLog['severity'] = 'medium',
    userId?: string
  ) => {
    errorHandler.handleError(error, context, severity, userId);
  };

  const handleApiError = (apiError: ApiError, context: string, userId?: string) => {
    errorHandler.handleApiError(apiError, context, userId);
  };

  const handleNetworkError = (error: Error, context: string, userId?: string) => {
    errorHandler.handleNetworkError(error, context, userId);
  };

  const handleAuthError = (error: Error | ApiError, context: string, userId?: string) => {
    errorHandler.handleAuthError(error, context, userId);
  };

  const handlePaymentError = (error: Error | ApiError, context: string, userId?: string) => {
    errorHandler.handlePaymentError(error, context, userId);
  };

  const handleVideoUploadError = (error: Error | ApiError, context: string, userId?: string) => {
    errorHandler.handleVideoUploadError(error, context, userId);
  };

  const handleAIToolError = (error: Error | ApiError, context: string, userId?: string) => {
    errorHandler.handleAIToolError(error, context, userId);
  };

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleAuthError,
    handlePaymentError,
    handleVideoUploadError,
    handleAIToolError,
    getErrorStats: () => errorHandler.getErrorStats(),
    clearErrorLogs: () => errorHandler.clearErrorLogs(),
    exportErrorLogs: () => errorHandler.exportErrorLogs(),
  };
};

// Global error boundary helper
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalHandler = (global as any).onunhandledrejection;
    (global as any).onunhandledrejection = (event: any) => {
      errorHandler.handleError(
        event.reason,
        'Unhandled Promise Rejection',
        'high'
      );
      
      if (originalHandler) {
        originalHandler(event);
      }
    };

    // Handle uncaught exceptions (React Native specific)
    if ((global as any).ErrorUtils) {
      const originalGlobalHandler = (global as any).ErrorUtils.getGlobalHandler();
      (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        errorHandler.handleError(
          error,
          'Uncaught Exception',
          isFatal ? 'critical' : 'high'
        );
        
        if (originalGlobalHandler) {
          originalGlobalHandler(error, isFatal);
        }
      });
    }
  }
};

export default errorHandler;
