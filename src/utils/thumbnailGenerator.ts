/**
 * Thumbnail Generation Utility
 * Generates and caches video thumbnails for better performance
 */

import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { DEBUG_CONFIG } from '../constants';

const THUMBNAIL_CACHE_DIR = `${FileSystem.cacheDirectory}video-thumbnails/`;

// Initialize cache directory
const initializeCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(THUMBNAIL_CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing thumbnail cache:', error);
  }
};

// Generate a unique cache key based on video URL
const generateCacheKey = (videoUrl: string): string => {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < videoUrl.length; i++) {
    const char = videoUrl.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `thumbnail_${Math.abs(hash)}.jpg`;
};

// Get cached thumbnail path
const getCachedThumbnailPath = (videoUrl: string): string => {
  const cacheKey = generateCacheKey(videoUrl);
  return `${THUMBNAIL_CACHE_DIR}${cacheKey}`;
};

/**
 * Generate thumbnail from video URL
 * Attempts to retrieve from cache first, then generates if not cached
 *
 * @param videoUrl - URL of the video
 * @param timeMs - Time in milliseconds at which to generate thumbnail (default: 0)
 * @returns Promise resolving to thumbnail URI
 */
export const generateVideoThumbnail = async (
  videoUrl: string,
  timeMs: number = 0
): Promise<string | null> => {
  try {
    await initializeCache();

    const cachedPath = getCachedThumbnailPath(videoUrl);

    // Check if thumbnail is already cached
    try {
      const cachedInfo = await FileSystem.getInfoAsync(cachedPath);
      if (cachedInfo.exists) {
        if (DEBUG_CONFIG.THUMBNAIL_GENERATION) {
          console.log('✅ Using cached thumbnail:', cachedPath);
        }
        return cachedPath;
      }
    } catch (error) {
      // Cache miss, continue to generate
    }

    // Generate new thumbnail
    if (DEBUG_CONFIG.THUMBNAIL_GENERATION) {
      console.log('📹 Generating thumbnail for:', videoUrl);
    }

    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
      time: timeMs,
    });

    // Cache the thumbnail
    try {
      await FileSystem.copyAsync({
        from: uri,
        to: cachedPath,
      });

      if (DEBUG_CONFIG.THUMBNAIL_GENERATION) {
        console.log('✅ Thumbnail cached at:', cachedPath);
      }

      return cachedPath;
    } catch (cacheError) {
      // If caching fails, return the generated URI anyway
      console.warn('Warning: Could not cache thumbnail:', cacheError);
      return uri;
    }
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    return null;
  }
};

/**
 * Generate thumbnails for multiple videos
 * Useful for batch processing
 *
 * @param videoUrls - Array of video URLs
 * @returns Promise resolving to map of videoUrl -> thumbnailUri
 */
export const generateMultipleThumbnails = async (
  videoUrls: string[]
): Promise<Record<string, string | null>> => {
  const results: Record<string, string | null> = {};

  for (const url of videoUrls) {
    results[url] = await generateVideoThumbnail(url);
  }

  return results;
};

/**
 * Clear thumbnail cache
 */
export const clearThumbnailCache = async (): Promise<void> => {
  try {
    await FileSystem.deleteAsync(THUMBNAIL_CACHE_DIR, { idempotent: true });
    await initializeCache();
    if (DEBUG_CONFIG.THUMBNAIL_GENERATION) {
      console.log('✅ Thumbnail cache cleared');
    }
  } catch (error) {
    console.error('Error clearing thumbnail cache:', error);
  }
};

/**
 * Get cache size
 */
export const getThumbnailCacheSize = async (): Promise<number> => {
  try {
    const files = await FileSystem.readDirectoryAsync(THUMBNAIL_CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${THUMBNAIL_CACHE_DIR}${file}`);
      if (fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
};
