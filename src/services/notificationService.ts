import { apiService } from './api';
import { ApiResponse, PaginatedResponse } from '../types';

export interface Notification {
  id: string;
  userId: string;
  type: 'VIDEO_APPROVED' | 'VIDEO_REJECTED' | 'NEW_FOLLOWER' | 'VIDEO_LIKED' | 'VIDEO_COMMENTED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'AI_TOOL_APPROVED' | 'AI_TOOL_REJECTED' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  videoApproval: boolean;
  newFollowers: boolean;
  videoEngagement: boolean;
  paymentUpdates: boolean;
  systemAnnouncements: boolean;
}

class NotificationService {
  private readonly BASE_PATH = '/notifications';
  private eventSource: EventSource | null = null;
  private listeners: Map<string, ((notification: Notification) => void)[]> = new Map();

  /**
   * Get user notifications with pagination
   */
  async getNotifications(page: number = 0, size: number = 20, unreadOnly: boolean = false): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    try {
      const params: any = { page, size };
      if (unreadOnly) params.unreadOnly = true;
      
      const queryString = apiService.buildQueryString(params);
      const url = `${this.BASE_PATH}${queryString}`;
      return await apiService.get<PaginatedResponse<Notification>>(url);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      return await apiService.get<{ count: number }>(`${this.BASE_PATH}/unread-count`);
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.put(`${this.BASE_PATH}/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<any>> {
    try {
      return await apiService.put(`${this.BASE_PATH}/mark-all-read`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete(`${this.BASE_PATH}/all`);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    try {
      return await apiService.get<NotificationPreferences>(`${this.BASE_PATH}/preferences`);
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
    try {
      return await apiService.put<NotificationPreferences>(`${this.BASE_PATH}/preferences`, preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Send test notification (admin only)
   */
  async sendTestNotification(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/test`, {
        userId,
        ...notification
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Register for push notifications
   */
  async registerPushToken(token: string, platform: 'web' | 'ios' | 'android'): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/push/register`, {
        token,
        platform
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
      throw error;
    }
  }

  /**
   * Unregister push notifications
   */
  async unregisterPushToken(token: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`${this.BASE_PATH}/push/unregister`, {
        token
      });
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      throw error;
    }
  }

  // Real-time notifications using Server-Sent Events (SSE)

  /**
   * Connect to real-time notifications
   */
  connectRealTime(accessToken: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      const url = `${this.BASE_PATH}/stream`;
      this.eventSource = new EventSource(`${url}?token=${accessToken}`);

      this.eventSource.onopen = () => {
        console.log('✅ Connected to notification stream');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.handleRealtimeNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Notification stream error:', error);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.connectRealTime(accessToken);
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to connect to notification stream:', error);
    }
  }

  /**
   * Disconnect from real-time notifications
   */
  disconnectRealTime(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 Disconnected from notification stream');
    }
  }

  /**
   * Add listener for specific notification types
   */
  addListener(type: string, callback: (notification: Notification) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(type: string, callback: (notification: Notification) => void): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      const index = typeListeners.indexOf(callback);
      if (index > -1) {
        typeListeners.splice(index, 1);
      }
    }
  }

  /**
   * Remove all listeners for a type
   */
  removeAllListeners(type?: string): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Handle incoming real-time notification
   */
  private handleRealtimeNotification(notification: Notification): void {
    // Notify type-specific listeners
    const typeListeners = this.listeners.get(notification.type);
    if (typeListeners) {
      typeListeners.forEach(callback => callback(notification));
    }

    // Notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(notification));
    }

    // Show browser notification if supported and enabled
    this.showBrowserNotification(notification);
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/icon.png',
          badge: '/assets/icon.png',
          tag: notification.id,
          requireInteraction: false,
          silent: false
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          // Handle notification click (e.g., navigate to relevant screen)
          this.handleNotificationClick(notification);
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(notification: Notification): void {
    // This would typically navigate to the relevant screen
    // Implementation depends on your navigation system
    console.log('Notification clicked:', notification);
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (!this.eventSource) {
      return 'disconnected';
    }

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  /**
   * Format notification for display
   */
  formatNotification(notification: Notification): {
    icon: string;
    color: string;
    timeAgo: string;
  } {
    const now = new Date();
    const createdAt = new Date(notification.createdAt);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo: string;
    if (diffMins < 1) {
      timeAgo = 'Just now';
    } else if (diffMins < 60) {
      timeAgo = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`;
    } else {
      timeAgo = `${diffDays}d ago`;
    }

    const typeConfig = {
      VIDEO_APPROVED: { icon: 'checkmark-circle', color: '#10B981' },
      VIDEO_REJECTED: { icon: 'close-circle', color: '#EF4444' },
      NEW_FOLLOWER: { icon: 'person-add', color: '#3B82F6' },
      VIDEO_LIKED: { icon: 'heart', color: '#EF4444' },
      VIDEO_COMMENTED: { icon: 'chatbubble', color: '#8B5CF6' },
      PAYMENT_SUCCESS: { icon: 'card', color: '#10B981' },
      PAYMENT_FAILED: { icon: 'card', color: '#EF4444' },
      AI_TOOL_APPROVED: { icon: 'star', color: '#10B981' },
      AI_TOOL_REJECTED: { icon: 'close-circle', color: '#EF4444' },
      SYSTEM_ANNOUNCEMENT: { icon: 'megaphone', color: '#F59E0B' },
    };

    const config = typeConfig[notification.type] || { icon: 'notifications', color: '#6B7280' };

    return {
      ...config,
      timeAgo
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
