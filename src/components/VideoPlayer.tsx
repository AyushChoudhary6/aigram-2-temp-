import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { videoService } from '../services/videoService';
import { useAuth } from '../context/AppContext';
import { Video } from '../types';
import { DEBUG_CONFIG } from '../constants';
import { VideoSourceResolver } from '../utils/videoSourceResolver';

interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  showControls?: boolean;
  onVideoEnd?: () => void;
  onError?: (error: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate available video height (accounting for UI elements if needed)
const AVAILABLE_HEIGHT = screenHeight;

export default function VideoPlayer({
  video,
  autoPlay = false,
  showControls = true,
  onVideoEnd,
  onError,
}: VideoPlayerProps) {
  const { user, isGuestUser } = useAuth();
  const videoViewRef = useRef<VideoView>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | number | null>(null);
  const [hasViewPermission, setHasViewPermission] = useState(true);

  // expo-video player — source is set once streamUrl is resolved
  const nativeSource = typeof streamUrl === 'string' ? streamUrl : typeof streamUrl === 'number' ? streamUrl : null;
  const player = useVideoPlayer(nativeSource, p => {
    p.loop = false;
    if (autoPlay) p.play();
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setPosition(currentTime * 1000);
  });
  useEventListener(player, 'sourceLoad', ({ duration: d }) => {
    setDuration(d * 1000);
  });
  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    setIsPlaying(playing);
  });
  useEventListener(player, 'playToEnd', () => {
    onVideoEnd?.();
  });
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error' && error) {
      console.error('Video playback error:', error.message);
      onError?.(error.message);
    }
  });

  // Sync play state when autoPlay or streamUrl change
  useEffect(() => {
    if (!nativeSource) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [nativeSource]);

  useEffect(() => {
    checkViewPermissionAndLoadVideo();
  }, [video.videoId]);

  useEffect(() => {
    if (showControlsOverlay && showControls) {
      const timer = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControlsOverlay, showControls]);

  const checkViewPermissionAndLoadVideo = async () => {
    try {
      setIsLoading(true);

      // Resolve the video source first (handles S3, cloud, and local paths)
      const sourceData = {
        videoUrl: video.videoUrl,
        streamUrl: video.streamUrl,
        videoPath: video.videoPath
      };
      
      const resolutionResult = await VideoSourceResolver.resolveVideoSource(sourceData, video.videoId);
      
      if (resolutionResult.success) {
        setStreamUrl(resolutionResult.data.streamUrl);
        
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('ðŸŽ¬ Video source resolved successfully:', {
            videoId: video.videoId,
            streamUrl: resolutionResult.data.streamUrl,
            provider: resolutionResult.data.provider
          });
        }
        
        // Record view (non-blocking)
        videoService.recordView(video.videoId).catch(error => {
          console.warn('Failed to record view:', error);
        });
        
        setIsLoading(false);
        return;
      }

      // Check guest view permission if user is guest and resolution wasn't direct
      if (isGuestUser()) {
        const permissionResponse = await videoService.canGuestViewVideo(video.videoId);
        if (!permissionResponse.success || !permissionResponse.data.canView) {
          setHasViewPermission(false);
          setIsLoading(false);
          return;
        }
      }

      // Get stream URL from backend as fallback
      const streamResponse = await videoService.getStreamUrl(video.videoId);
      if (streamResponse.success && streamResponse.data.streamUrl) {
        setStreamUrl(streamResponse.data.streamUrl);
        
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('ðŸŽ¬ Video stream loaded from service fallback:', {
            videoId: video.videoId,
            streamUrl: streamResponse.data.streamUrl
          });
        }
      } else {
        throw new Error(streamResponse.message || 'Failed to get stream URL');
      }
    } catch (error: any) {
      console.error('Error loading video:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to load video. Please try again.';
      
      if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = 'You are not authorized to view this video.';
      } else if (error.message?.includes('Not Found')) {
        errorMessage = 'Video not found or has been removed.';
      } else if (error.message?.includes('fallback')) {
        errorMessage = 'Using sample video due to backend unavailability.';
        // Don't show alert for fallback, just log
        console.warn('Using fallback video:', error.message);
        return;
      }
      
      onError?.(error.message || errorMessage);
      Alert.alert('Video Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    // replaced by useEventListener hooks above
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekTo = (positionMillis: number) => {
    player.currentTime = positionMillis / 1000;
  };

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await videoViewRef.current?.exitFullscreen();
      } else {
        await videoViewRef.current?.enterFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoPress = () => {
    if (showControls) {
      setShowControlsOverlay(!showControlsOverlay);
    }
  };

  if (!hasViewPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.restrictedContainer}>
          <Ionicons name="lock-closed" size={48} color="#dc3545" />
          <Text style={styles.restrictedTitle}>View Limit Reached</Text>
          <Text style={styles.restrictedText}>
            Guest users have reached the daily view limit. Please register to continue watching videos.
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading || !streamUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D084" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <VideoView
          ref={videoViewRef}
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />

        {showControls && showControlsOverlay && (
          <View style={styles.controlsOverlay}>
            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="white"
              />
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.progressThumb,
                    { left: `${duration > 0 ? (position / duration) * 100 : 0}%` },
                  ]}
                  onPress={() => {
                    // Handle progress bar touch
                  }}
                />
              </View>

              {/* Time and Controls */}
              <View style={styles.timeAndControls}>
                <Text style={styles.timeText}>
                  {formatTime(position)} / {formatTime(duration)}
                </Text>

                <View style={styles.rightControls}>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={toggleFullscreen}
                    >
                      <Ionicons
                        name={isFullscreen ? 'contract' : 'expand'}
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.videoStats}>
          {videoService.formatViewCount(video.viewCount)} â€¢ {video.likeCount} likes
        </Text>
        <Text style={styles.videoDescription} numberOfLines={2}>
          {video.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    width: screenWidth,
    height: AVAILABLE_HEIGHT,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#E8F5E8',
    marginTop: 10,
    fontSize: 16,
  },
  restrictedContainer: {
    flex: 1,
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161616',
    padding: 20,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 10,
    marginBottom: 10,
  },
  restrictedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555555',
    marginBottom: 20,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#00D084',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#E8F5E8',
    fontWeight: '600',
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    padding: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D084',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#00D084',
    borderRadius: 8,
    marginLeft: -8,
  },
  timeAndControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#E8F5E8',
    fontSize: 14,
    fontWeight: '500',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginLeft: 8,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  videoStats: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: '#EEE',
    lineHeight: 20,
  },
});

