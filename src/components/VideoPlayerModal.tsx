import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export interface VideoPlaylistItem {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  title?: string;
  originalName?: string;
  blobUrl?: string;
}

interface VideoPlayerModalProps {
  visible: boolean;
  items: VideoPlaylistItem[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  items,
  initialIndex = 0,
  onClose,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentItem = items[currentIndex];
  const isVideo = currentItem?.type === 'video';
  const mediaUrl = currentItem?.blobUrl || currentItem?.mediaUrl;
  const title = currentItem?.title || currentItem?.originalName || `Media ${currentIndex + 1}`;

  // expo-video player for native; always created, source is null when not a video
  const player = useVideoPlayer(isVideo && mediaUrl ? mediaUrl : null, p => {
    p.loop = false;
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    setIsLoading(status === 'loading');
  });
  useEventListener(player, 'sourceLoad', ({ duration: d }) => {
    setDuration(d * 1000);
    setIsLoading(false);
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setPosition(currentTime * 1000);
  });
  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    setIsPlaying(playing);
  });
  useEventListener(player, 'playToEnd', () => {
    if (currentIndex < items.length - 1) handleNextVideo();
  });

  // Reset controls visibility timeout
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (controlsVisible && isVideo) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 5000); // Hide controls after 5 seconds
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [controlsVisible, isVideo]);

  // Auto-play when component mounts or item changes
  useEffect(() => {
    if (visible && isVideo) {
      player.play();
      setIsPlaying(true);
    }
  }, [visible, currentIndex, isVideo]);

  // Hide controls on media modal open
  useEffect(() => {
    if (visible) {
      setControlsVisible(true);
    }
  }, [visible]);

  const handlePlaybackStatusUpdate = (status: any) => {
    // replaced by useEventListener hooks above
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
    setControlsVisible(true);
  };

  const handleNextVideo = () => {
    if (currentIndex < items.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
      setIsPlaying(true);
      setPosition(0);
    }
  };

  const handlePreviousVideo = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
      setIsPlaying(true);
      setPosition(0);
    }
  };

  const handleSeek = (value: number) => {
    player.currentTime = value / 1000;
    setPosition(value);
  };

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {/* Video/Image Display */}
        <TouchableOpacity
          style={styles.mediaContainer}
          activeOpacity={1}
          onPress={toggleControls}
        >
          {isVideo && mediaUrl ? (
            <>
              <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls={false}
              />
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>Image Preview</Text>
            </View>
          )}

          {/* Video Controls */}
          {controlsVisible && (
            <View style={styles.controlsOverlay}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
              </View>

              {/* Bottom Controls */}
              {isVideo && (
                <View style={styles.bottomControls}>
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${Math.max(0, Math.min(100, progressPercentage))}%` },
                      ]}
                    />
                  </View>

                  {/* Controls Row */}
                  <View style={styles.controlsRow}>
                    <TouchableOpacity
                      onPress={handlePreviousVideo}
                      disabled={currentIndex === 0}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Ionicons
                        name="play-skip-back"
                        size={28}
                        color={currentIndex === 0 ? COLORS.mutedForeground : '#E8F5E8'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleTogglePlayPause}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={32}
                        color="white"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleNextVideo}
                      disabled={currentIndex === items.length - 1}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Ionicons
                        name="play-skip-forward"
                        size={28}
                        color={currentIndex === items.length - 1 ? COLORS.mutedForeground : '#E8F5E8'}
                      />
                    </TouchableOpacity>

                    <Text style={styles.timeText}>
                      {formatTime(position)} / {formatTime(duration)}
                    </Text>
                  </View>

                  {/* Slide Index */}
                  <Text style={styles.slideIndex}>
                    {currentIndex + 1} / {items.length}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mediaContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  placeholderText: {
    color: COLORS.mutedForeground,
    fontSize: TYPOGRAPHY.fontSizes.lg,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  title: {
    flex: 1,
    color: '#E8F5E8',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    marginRight: SPACING.md,
  },
  bottomControls: {
    paddingHorizontal: SPACING.md,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timeText: {
    color: '#E8F5E8',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginLeft: SPACING.md,
  },
  slideIndex: {
    color: '#E8F5E8',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    textAlign: 'right',
    opacity: 0.7,
  },
});

export default VideoPlayerModal;


