/**
 * AWS Video Upload Service
 * Handles video uploads to AWS S3 with metadata storage in DynamoDB
 */

import * as DocumentPicker from 'expo-document-picker';
import axios, { AxiosInstance } from 'axios';
import { DEBUG_CONFIG, AWS_CONFIG } from '../constants';

interface VideoMetadata {
  title: string;
  description?: string;
  userId: string;
  duration?: number;
  tags?: string[];
}

interface SASTokenResponse {
  success: boolean;
  sasUrl: string;
  blobName: string;
  containerName: string;
  storageAccountName: string;
  expiresIn: string;
  correlationId?: string;
  contentType?: string;
  uploadInstructions?: {
    method?: string;
    url?: string;
    headers?: {
      xMsBlobType?: string;
      contentType?: string;
    };
  };
}

interface VideoUploadMetadataResponse {
  success: boolean;
  message: string;
  video: {
    videoId: string;
    userId: string;
    originalName: string;
    blobUrl: string;
    uploadedAt: string;
    // Keeping older fields too just in case existing code relies on them
    blobName?: string;
    title?: string;
    status?: string;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FetchedVideo {
  videoId: string;
  userId: string;
  originalName: string;
  blobUrl: string;
  uploadedAt: string;
}

class AWSVideoUploadService {
  private backendUrl: string;
  private http: AxiosInstance;

  constructor(backendUrl?: string) {
    // Use custom URL if provided, otherwise use AWS_CONFIG
    this.backendUrl = backendUrl || AWS_CONFIG.BACKEND_URL;
    // BACK/ backend returns plain DTOs (not ApiResponse wrapper), so use a dedicated client.
    this.http = axios.create({
      baseURL: this.backendUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Pick video file from device storage
   */
  async pickVideoFile(): Promise<DocumentPicker.DocumentPickerAsset | null> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📹 Opening file picker...');
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: false,
      });

      // Handle cancelled action
      if (result.canceled) {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('📹 Video pick cancelled');
        }
        return null;
      }

      // Handle success - result.assets is an array in newer versions
      const assets = result.assets || (result as any).assets;
      
      if (assets && Array.isArray(assets) && assets.length > 0) {
        const videoFile = assets[0];
        
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('📹 Video selected:', {
            name: videoFile.name,
            size: videoFile.size,
            uri: videoFile.uri,
            type: videoFile.mimeType,
          });
        }

        // Return in the expected format
        return {
          name: videoFile.name,
          size: videoFile.size,
          uri: videoFile.uri,
          mimeType: videoFile.mimeType,
        } as any;
      }

      // Handle old API format (result.type)
      if ((result as any).type === 'success') {
        const videoData = result as any;
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('📹 Video selected (old format):', {
            name: videoData.name,
            size: videoData.size,
            uri: videoData.uri,
          });
        }
        return videoData;
      }

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📹 No video selected');
      }
      return null;
    } catch (error) {
      console.error('Error picking video file:', error);
      throw error;
    }
  }

  /**
   * Pick image file from device storage
   */
  async pickImageFile(): Promise<DocumentPicker.DocumentPickerAsset | null> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🖼️ Opening image file picker...');
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: false,
      });

      // Handle cancelled action
      if (result.canceled) {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🖼️ Image pick cancelled');
        }
        return null;
      }

      // Handle success - result.assets is an array in newer versions
      const assets = result.assets || (result as any).assets;
      
      if (assets && Array.isArray(assets) && assets.length > 0) {
        const imageFile = assets[0];
        
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🖼️ Image selected:', {
            name: imageFile.name,
            size: imageFile.size,
            uri: imageFile.uri,
            type: imageFile.mimeType,
          });
        }

        // Return in the expected format
        return {
          name: imageFile.name,
          size: imageFile.size,
          uri: imageFile.uri,
          mimeType: imageFile.mimeType,
        } as any;
      }

      // Handle old API format (result.type)
      if ((result as any).type === 'success') {
        const imageData = result as any;
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('🖼️ Image selected (old format):', {
            name: imageData.name,
            size: imageData.size,
            uri: imageData.uri,
          });
        }
        return imageData;
      }

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🖼️ No image selected');
      }
      return null;
    } catch (error) {
      console.error('Error picking image file:', error);
      throw error;
    }
  }

  /**
   * Get SAS token for secure blob upload
   */
  async getSASToken(
    fileName: string,
    userId: string,
    folder?: string,
    contentType: string = 'video/mp4',
    fileSize?: number
  ): Promise<SASTokenResponse> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('🔐 Requesting SAS token for:', {
          fileName,
          userId,
          folder,
        });
      }

      // BACK endpoint: POST /api/upload/sas-token
      const { data } = await this.http.post<SASTokenResponse>('/api/upload/sas-token', {
        fileName,
        userId,
        folder,
      });

      if (!data?.sasUrl || !data?.blobName) {
        throw new Error('Failed to get SAS token (missing sasUrl/blobName)');
      }

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✅ SAS token received:', {
          blobName: data.blobName,
          expiresIn: data.expiresIn,
        });
      }

      return {
        ...data,
        contentType,
      };
    } catch (error) {
      console.error('Error getting SAS token:', error);
      throw error;
    }
  }

  /**
   * Upload video file to Azure Blob Storage using SAS URL
   */
  async uploadVideoToBlob(
    sasUrl: string,
    fileUri: string,
    fileName: string,
    contentType: string = 'video/mp4',
    uploadHeaders?: Record<string, string | undefined>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📤 Uploading video to AWS S3:', {
          fileName,
          sasUrl: sasUrl.substring(0, 50) + '...',
        });
      }

      // Read file
      const response = await fetch(fileUri);
      const fileBlob = await response.blob();

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage,
            });

            if (DEBUG_CONFIG.API_CALLS) {
              console.log(`📊 Upload progress: ${percentage}%`);
            }
          }
        });
      }

      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 201 || xhr.status === 200) {
            if (DEBUG_CONFIG.API_CALLS) {
              console.log('✅ Video uploaded successfully to Blob Storage');
            }
            resolve();
          } else {
            reject(
              new Error(
                `Upload failed with status ${xhr.status}: ${xhr.statusText}`
              )
            );
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timeout'));
        };

        xhr.open('PUT', sasUrl);
        // Azure Blob uploads typically require x-ms-blob-type: BlockBlob
        const headerEntries = Object.entries(uploadHeaders || {});
        headerEntries.forEach(([key, value]) => {
          if (value) xhr.setRequestHeader(key, value);
        });
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.timeout = 300000; // 5 minutes timeout

        xhr.send(fileBlob);
      });
    } catch (error) {
      console.error('Error uploading video to blob:', error);
      throw error;
    }
  }

  /**
   * Store video metadata in DynamoDB
   */
  async storeVideoMetadata(
    storagePath: string,
    metadata: VideoMetadata,
    originalName?: string,
    correlationId?: string
  ): Promise<VideoUploadMetadataResponse> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('💾 Storing video metadata:', {
          blobName: storagePath,
          title: metadata.title,
          userId: metadata.userId,
        });
      }

      // BACK endpoint: POST /api/upload/video
      const { data } = await this.http.post<any>('/api/upload/video', {
        blobName: storagePath,
        userId: metadata.userId,
        title: metadata.title || originalName || 'Untitled Video',
        description: metadata.description || '',
        tags: metadata.tags || [],
        originalName: originalName || metadata.title,
      });

      const videoId = data?.videoId || data?.id;

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✅ Metadata stored successfully:', { videoId });
      }

      return {
        success: true,
        message: 'Video metadata stored successfully',
        video: {
          videoId: videoId || storagePath,
          userId: metadata.userId,
          originalName: originalName || metadata.title,
          blobUrl: data?.blobUrl || storagePath,
          uploadedAt: new Date().toISOString(),
          blobName: storagePath,
          title: metadata.title,
          status: data?.status,
        },
      };
    } catch (error) {
      console.error('Error storing metadata:', error);
      throw error;
    }
  }

  /**
   * Complete video upload flow: SAS token → Upload to Blob → Store metadata
   */
  async uploadVideo(
    userId: string,
    metadata: VideoMetadata,
    videoFile: DocumentPicker.DocumentPickerAsset,
    onProgress?: (status: string, progress?: UploadProgress) => void,
    folder: string = 'practice-arena'
  ): Promise<VideoUploadMetadataResponse> {
    try {
      if (!videoFile.name) {
        throw new Error('Invalid video file');
      }

      // Step 1: Get SAS token
      if (onProgress) onProgress('Getting secure upload token...');

      const contentType = videoFile.mimeType || 'video/mp4';
      const sasTokenResponse = await this.getSASToken(
        videoFile.name,
        userId,
        folder,
        contentType,
        videoFile.size
      );
      const { sasUrl, blobName, correlationId, uploadInstructions } = sasTokenResponse;

      // Step 2: Upload video to blob storage
      if (onProgress) onProgress('Uploading video...', { loaded: 0, total: 100, percentage: 0 });

      await this.uploadVideoToBlob(
        sasUrl,
        videoFile.uri,
        videoFile.name,
        contentType,
        {
          ...(uploadInstructions?.headers?.xMsBlobType
            ? { 'x-ms-blob-type': uploadInstructions.headers.xMsBlobType }
            : { 'x-ms-blob-type': 'BlockBlob' }),
        },
        (progress) => {
          if (onProgress) {
            onProgress(
              `Uploading video... ${progress.percentage}%`,
              progress
            );
          }
        }
      );

      // Step 3: Store metadata in DynamoDB
      if (onProgress) onProgress('Saving metadata...');

      const metadataResponse = await this.storeVideoMetadata(
        blobName,
        metadata,
        videoFile.name,
        correlationId
      );

      if (onProgress) onProgress('Upload complete!');

      return metadataResponse;
    } catch (error) {
      console.error('Error in complete upload flow:', error);
      throw error;
    }
  }

  /**
   * Set backend URL (useful for switching between dev/prod)
   */
  setBackendUrl(url: string) {
    this.backendUrl = url;
    this.http = axios.create({
      baseURL: this.backendUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    if (DEBUG_CONFIG.API_CALLS) {
      console.log('🔗 Backend URL updated:', url);
    }
  }

  /**
   * Get current backend URL
   */
  getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Fetch all videos explicitly stored in a specific folder (like practice-arena)
   */
  async getFolderVideos(folderName: string = 'practice-arena'): Promise<FetchedVideo[]> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log(`🔍 Fetching videos for folder: ${folderName}`);
      }

      // BACK endpoint: use query-param form to support folder names with '/'
      // GET /api/upload/folder?folderName=profile/user/photos
      const { data } = await this.http.get<any>(`/api/upload/folder`, {
        params: { folderName },
      });
      const videos = this.extractVideos({ data }).map((video) => this.toFetchedVideo(video));

      if (DEBUG_CONFIG.API_CALLS) {
        console.log(`Successfully fetched ${videos.length} videos from ${folderName}`);
      }

      return videos;
    } catch (error) {
      console.error(`Error fetching videos for folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all videos uploaded by a specific user regardless of the folder
   */
  async getUserVideos(userId: string): Promise<FetchedVideo[]> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log(`🔍 Fetching videos for user: ${userId}`);
      }

      // BACK endpoint: GET /api/upload/user/{userId}/videos
      const { data } = await this.http.get<any>(`/api/upload/user/${encodeURIComponent(userId)}/videos`);
      const videos = this.extractVideos({ data }).map((video) => this.toFetchedVideo(video));

      if (DEBUG_CONFIG.API_CALLS) {
        console.log(`Successfully fetched ${videos.length} videos for user ${userId}`);
      }

      return videos;
    } catch (error) {
      console.error(`Error fetching videos for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update social media handles for a specific video
   */
  async updateVideoSocialHandles(
    videoId: string,
    userId: string,
    socialHandles: {
      instagramHandle?: string;
      twitterHandle?: string;
      linkedinHandle?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (DEBUG_CONFIG.API_CALLS) {
        console.log('📱 Updating social handles for video:', videoId, socialHandles);
      }

      // BACK backend currently supports metadata updates via PUT /api/upload/metadata/{videoId}
      const { data } = await this.http.put<any>(`/api/upload/metadata/${encodeURIComponent(videoId)}`, {
        userId,
        ...socialHandles,
      });

      if (DEBUG_CONFIG.API_CALLS) {
        console.log('✅ Video metadata updated successfully for video:', videoId);
      }

      return { success: true, message: data?.message || 'Video updated successfully' };
    } catch (error) {
      console.error('Error updating social handles:', error);
      throw error;
    }
  }

  private extractVideos(response: any): any[] {
    const data = response?.data;
    if (Array.isArray(data?.videos)) return data.videos;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  private toFetchedVideo(video: any): FetchedVideo {
    const mediaUrl = video.videoUrl || video.originalVideoUrl || video.blobUrl || '';
    return {
      videoId: video.videoId || video.id,
      userId: video.uploaderId || video.userId,
      originalName: video.title || video.originalName || 'Untitled',
      blobUrl: mediaUrl,
      uploadedAt: video.createdAt || video.uploadedAt || new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const awsVideoUploadService = new AWSVideoUploadService();

export default AWSVideoUploadService;
