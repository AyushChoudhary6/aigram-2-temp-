import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Platform-aware secure storage utility
 * Uses SecureStore on native platforms and AsyncStorage on web
 */
class SecureStorageService {
  private isWeb = Platform.OS === 'web';

  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        // Use AsyncStorage for web compatibility
        await AsyncStorage.setItem(key, value);
      } else {
        // Use SecureStore for native platforms
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        // Use AsyncStorage for web compatibility
        return await AsyncStorage.getItem(key);
      } else {
        // Use SecureStore for native platforms
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error retrieving item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a value securely
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        // Use AsyncStorage for web compatibility
        await AsyncStorage.removeItem(key);
      } else {
        // Use SecureStore for native platforms
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if running on web platform
   */
  isWebPlatform(): boolean {
    return this.isWeb;
  }

  /**
   * Clear all stored items (use with caution)
   */
  async clear(): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.clear();
      } else {
        // For native platforms, we need to remove items individually
        // This is a simplified version - in production, you'd want to track keys
        console.warn('SecureStore does not support clear() - remove items individually');
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys (web only)
   */
  async getAllKeys(): Promise<readonly string[]> {
    try {
      if (this.isWeb) {
        return await AsyncStorage.getAllKeys();
      } else {
        console.warn('getAllKeys() not supported on native platforms with SecureStore');
        return [];
      }
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
export default secureStorage;
