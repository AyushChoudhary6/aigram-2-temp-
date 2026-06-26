import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from '../types';
import { COLORS } from '../constants/theme';

interface ShortsVideoFeedProps {
  videos: Video[];
  initialVideoIndex?: number;
  onVideoPress?: (video: Video) => void;
  onVideoLike?: (video: Video) => boolean;
}

interface CardInfoProps {
  title: string;
  description: string;
  tags: string[];
}

const ExpandableCardInfo: React.FC<CardInfoProps> = ({ title, description, tags }) => {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = useCallback(() => {
    if (!expanded) {
      setExpanded(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setExpanded(false));
    }
  }, [expanded, fadeAnim]);

  return (
    <View>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
        <Text style={styles.cardTitle} numberOfLines={expanded ? undefined : 2}>
          {title}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.cardDescription}>
            {description}
          </Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, i) => (
              <Text key={i} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const ShortsVideoFeed: React.FC<ShortsVideoFeedProps> = ({
  videos,
  initialVideoIndex = 0,
  onVideoPress,
}) => {
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [feedLayout, setFeedLayout] = useState({ width: windowWidth, height: windowHeight });
  const feedWidth = feedLayout.width || windowWidth;
  const feedHeight = feedLayout.height || windowHeight;
  const flatListRef = useRef<FlatList<Video>>(null);

  const handleLike = useCallback((videoId: string) => {
    setLikedVideos((prevLiked) => {
      const nextLiked = new Set(prevLiked);
      if (nextLiked.has(videoId)) {
        nextLiked.delete(videoId);
      } else {
        nextLiked.add(videoId);
      }
      return nextLiked;
    });
  }, []);

  const handleFeedLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setFeedLayout({ width, height });
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const targetIndex = Math.round(offsetY / feedHeight);
      const targetOffset = targetIndex * feedHeight;
      if (Math.abs(offsetY - targetOffset) > 1) {
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }
    },
    [feedHeight]
  );

  const renderContentCard = ({ item, index }: { item: Video; index: number }) => {
    return (
      <View
        style={[
          styles.cardContainer,
          { width: feedWidth, height: feedHeight },
        ]}
      >
        {/* Background Gradient */}
        <View style={[styles.cardBackground, { backgroundColor: getGradientColor(index) }]} />

        {/* Content Layout */}
        <View style={styles.cardContent}>
          {/* Left Side - Creator Info & Content */}
          <View style={styles.leftSection}>
            {/* Creator Header */}
            <View style={styles.creatorSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.title?.[0] || 'S'}
                </Text>
              </View>
              <View style={styles.creatorMeta}>
                <Text style={styles.creatorName} numberOfLines={1}>
                  @aibuilder_pro
                </Text>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Title (tap to expand description & tags) */}
            <ExpandableCardInfo
              title={item.title || 'How I Built an AI App in 10 Minutes'}
              description={item.description || 'Using ChatGPT + Lovable to create a full-stack app from scratch. No code, just pure AI magic!'}
              tags={['#AI', '#NoCode', '#Tutorial']}
            />
          </View>

          {/* Right Side - Engagement Metrics */}
          <View style={styles.rightSection}>
            {/* Like */}
            <TouchableOpacity 
              style={styles.engagementButton}
              onPress={() => handleLike(item.videoId)}
            >
              <Ionicons
                name={likedVideos.has(item.videoId) ? 'heart' : 'heart-outline'}
                size={24}
                color={likedVideos.has(item.videoId) ? '#FF1744' : '#FFF'}
              />
              <Text style={styles.engagementCount}>2.4K</Text>
            </TouchableOpacity>

            {/* Comments */}
            <TouchableOpacity 
              style={styles.engagementButton}
              onPress={() => onVideoPress?.(item)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={24}
                color="#FFF"
              />
              <Text style={styles.engagementCount}>189</Text>
            </TouchableOpacity>

            {/* Bookmark */}
            <TouchableOpacity style={styles.engagementButton}>
              <Ionicons
                name="bookmark-outline"
                size={24}
                color="#FFF"
              />
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={styles.engagementButton}>
              <Ionicons
                name="share-social-outline"
                size={24}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getGradientColor = (index: number) => {
    const colors = ['#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#6366F1'];
    return colors[index % colors.length];
  };

  if (videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.mutedForeground} />
        <Text style={styles.emptyText}>No content available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleFeedLayout}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderContentCard}
        keyExtractor={(item) => item.videoId}
        pagingEnabled={true}
        snapToInterval={feedHeight}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialScrollIndex={Math.min(Math.max(initialVideoIndex, 0), Math.max(videos.length - 1, 0))}
        getItemLayout={(_data, index) => ({
          length: feedHeight,
          offset: feedHeight * index,
          index,
        })}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
  emptyText: {
    color: COLORS.mutedForeground,
    marginTop: 16,
    fontSize: 16,
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    marginRight: 20,
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  creatorMeta: {
    flex: 1,
  },
  creatorName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  followBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    bordercolor: '#888888',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  followText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  cardDescription: {
    color: '#AAA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    color: '#999',
    fontSize: 12,
    marginRight: 4,
  },
  rightSection: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 24,
    minWidth: 60,
    paddingBottom: 12,
  },
  engagementButton: {
    alignItems: 'center',
    gap: 4,
  },
  engagementCount: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ShortsVideoFeed;


