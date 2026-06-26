import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  title?: string;
  originalName?: string;
  blobUrl?: string;
  uploadedAt?: string;
  userId?: string;
  videoId?: string;
}

interface MediaGridProps {
  media: MediaItem[];
  onMediaPress: (item: MediaItem, index: number) => void;
  loading?: boolean;
  numColumns?: number;
  onEndReached?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 3;
const ITEM_SIZE = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface MediaGridItemProps {
  item: MediaItem;
  index: number;
  onPress: (item: MediaItem, index: number) => void;
}

const MediaGridItem: React.FC<MediaGridItemProps> = ({ item, index, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const isVideo = item.type === 'video';
  const mediaUrl = item.blobUrl || item.mediaUrl;
  const thumbnailUrl = item.thumbnailUrl || mediaUrl;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleImageLoadEnd = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  return (
    <Animated.View style={[{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.mediaItemContainer}
        onPress={() => onPress(item, index)}
        activeOpacity={0.7}
      >
        {/* Image/Video Thumbnail */}
        {!imageError ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.mediaImage}
            onLoadEnd={handleImageLoadEnd}
            onError={handleImageError}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mediaImage, styles.errorPlaceholder]}>
            <Ionicons
              name={isVideo ? 'play-circle-outline' : 'image-outline'}
              size={32}
              color={COLORS.mutedForeground}
            />
          </View>
        )}

        {/* Loading Indicator */}
        {imageLoading && !imageError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}

        {/* Video Play Button Overlay */}
        {isVideo && !imageLoading && (
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color="white" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  onMediaPress,
  loading = false,
  numColumns = COLUMN_COUNT,
  onEndReached,
}) => {
  const handleEndReached = useCallback(() => {
    if (onEndReached) {
      onEndReached();
    }
  }, [onEndReached]);

  if (media.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color={COLORS.mutedForeground} />
      </View>
    );
  }

  return (
    <FlatList
      data={media}
      renderItem={({ item, index }) => (
        <MediaGridItem item={item} index={index} onPress={onMediaPress} />
      )}
      keyExtractor={(item) => item.id || item.videoId || `${item.mediaUrl}-${Math.random()}`}
      numColumns={numColumns}
      scrollEnabled={false}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.content}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  mediaItemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  errorPlaceholder: {
    backgroundColor: COLORS.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  content: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
});

export default MediaGrid;
