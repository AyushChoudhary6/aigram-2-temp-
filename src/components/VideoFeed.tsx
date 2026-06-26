import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  ScrollView,
  Linking,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { videoService } from '../services/videoService';
import { Video, VideoSearchParams } from '../types';
import { VideoSourceResolver } from '../utils/videoSourceResolver';

const isWeb = Platform.OS === 'web';

// Hide browser's native video loading spinner (three-dot buffering indicator)
if (isWeb && typeof document !== 'undefined') {
  const styleId = 'hide-video-spinner';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      video::-webkit-media-controls,
      video::-webkit-media-controls-enclosure,
      video::-webkit-media-controls-panel,
      video::-webkit-media-controls-overlay-play-button {
        display: none !important;
        -webkit-appearance: none !important;
      }
      video::-moz-media-controls { display: none !important; }
    `;
    document.head.appendChild(style);
  }
}

interface VideoFeedProps {
  searchParams?: VideoSearchParams;
  onVideoPress?: (video: Video) => void;
  onVideoLike?: (video: Video) => void;
}

interface VideoCardProps {
  video: Video;
  onPress: (video: Video) => void;
  onLike: (video: Video) => void;
  bottomInset?: number;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPress,
  onLike,
  bottomInset = 0,
  isActive = false,
  isMuted = false,
  onToggleMute = () => { },
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const isScreenFocused = useIsFocused();
  const [isHolding, setIsHolding] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [webVideoUri, setWebVideoUri] = useState<string | null>(null);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [showSocialEdit, setShowSocialEdit] = useState(false);
  const [editInstagram, setEditInstagram] = useState(video.instagramHandle || '');
  const [editTwitter, setEditTwitter] = useState(video.twitterHandle || '');
  const [editLinkedin, setEditLinkedin] = useState(video.linkedinHandle || '');
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [resolvedSource, setResolvedSource] = useState<string | number | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const infoFadeAnim = useRef(new Animated.Value(0)).current;
  // Web uses a raw <video> ref; native uses expo-video player
  const videoRef = React.useRef<HTMLVideoElement | any>(null);

  const player = useVideoPlayer(isWeb ? null : resolvedSource, p => {
    p.loop = true;
    p.muted = isMuted;
  });

  // Resolve video source whenever videoUrl or streamUrl changes
  useEffect(() => {
    const resolveSource = async () => {
      try {
        setIsResolving(true);
        const sourceData = {
          videoUrl: video.videoUrl,
          streamUrl: video.streamUrl,
          videoPath: video.videoPath
        };
        
        const result = await VideoSourceResolver.resolveVideoSource(sourceData, video.videoId);
        if (result.success) {
          setResolvedSource(result.data.streamUrl);
        } else {
          // Fallback to original if resolution fails
          setResolvedSource(
            typeof video.videoUrl === 'string' || typeof video.videoUrl === 'number'
              ? video.videoUrl
              : (typeof video.streamUrl === 'string' || typeof video.streamUrl === 'number' ? video.streamUrl : null)
          );
        }
      } catch (error) {
        console.error('Error resolving video source for card:', error);
      } finally {
        setIsResolving(false);
      }
    };

    resolveSource();
  }, [video.videoUrl, video.streamUrl, video.videoId]);

  const handleToggleInfo = useCallback(() => {
    if (!expandedInfo) {
      setExpandedInfo(true);
      Animated.timing(infoFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(infoFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setExpandedInfo(false));
    }
  }, [expandedInfo, infoFadeAnim]);

  const actuallyActive = isActive && isScreenFocused && !isHolding;
  const [prevIsActive, setPrevIsActive] = useState(false);

  // Restart video from beginning each time it becomes the active slide
  useEffect(() => {
    if (isActive && !prevIsActive) {
      if (isWeb && videoRef.current) {
        videoRef.current.currentTime = 0;
      } else if (!isWeb) {
        player.replay();
      }
    }
    setPrevIsActive(isActive);
  }, [isActive]);

  // Web: imperatively drive play/pause and muted via the <video> ref
  useEffect(() => {
    if (!isWeb || !videoRef.current) return;
    // Set muted BEFORE calling play() to satisfy browser autoplay policy
    videoRef.current.muted = isMuted;
    if (actuallyActive) {
      videoRef.current.play?.()?.catch((e: any) => console.log('Autoplay prevented:', e));
    } else {
      videoRef.current.pause?.();
    }
  }, [actuallyActive, webVideoUri, isMuted]);

  // Native: drive expo-video player play/pause
  useEffect(() => {
    if (isWeb) return;
    if (actuallyActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [actuallyActive]);

  // Native: sync muted state
  useEffect(() => {
    if (isWeb) return;
    player.muted = isMuted;
  }, [isMuted]);

  const handlePress = () => {
    onToggleMute();
    setShowMuteIcon(true);
    setTimeout(() => setShowMuteIcon(false), 800);
  };

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await videoService.toggleLike(video.videoId);
      if (response.success) {
        setLikeCount(response.data.totalLikes);
        onLike(video);
      }
    } catch (error) {
      console.error('Error liking video:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSaveSocialHandles = async () => {
    setIsSavingSocial(true);
    try {
      const clean = (val: string) => val.trim().replace(/^@/, '');
      await videoService.updateVideo(video.videoId, {
        instagramHandle: clean(editInstagram) || undefined,
        twitterHandle: clean(editTwitter) || undefined,
        linkedinHandle: clean(editLinkedin) || undefined,
      });
      // Update local video object so icons work immediately
      video.instagramHandle = clean(editInstagram) || undefined;
      video.twitterHandle = clean(editTwitter) || undefined;
      video.linkedinHandle = clean(editLinkedin) || undefined;
      setShowSocialEdit(false);
      Alert.alert('Success', 'Social handles updated!');
    } catch (error) {
      console.error('Error saving social handles:', error);
      Alert.alert('Error', 'Failed to save social handles. Please try again.');
    } finally {
      setIsSavingSocial(false);
    }
  };

  useEffect(() => {
    if (!isWeb) return;
    if (!resolvedSource) {
      setWebVideoUri(null);
      return;
    }

    if (typeof resolvedSource === 'string') {
      setWebVideoUri(resolvedSource);
    } else if (typeof resolvedSource === 'number') {
      const asset = Asset.fromModule(resolvedSource);
      setWebVideoUri(asset.uri ?? null);
    }
  }, [resolvedSource]);

  const renderLeftContent = () => (
    <View style={isDesktop ? styles.desktopLeftContent : styles.leftContent}>
      {/* Creator Info */}
      <View style={styles.creatorInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {video.authorName?.[0] || video.title?.[0] || 'V'}
          </Text>
        </View>
        <View style={styles.creatorDetails}>
          <Text style={styles.creatorName} numberOfLines={1}>
            @{video.authorName?.replace(/\s+/g, '').toLowerCase() || 'creator'}
          </Text>
        </View>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* Title (tap to expand description & tags) */}
      <TouchableOpacity onPress={handleToggleInfo} activeOpacity={0.8}>
        <Text style={styles.cardTitle} numberOfLines={expandedInfo ? undefined : 2}>
          {video.title || 'Amazing Content'}
        </Text>
      </TouchableOpacity>

      {expandedInfo && (
        <Animated.View style={{ opacity: infoFadeAnim }}>
          {video.description ? (
            <Text style={styles.cardDescription}>
              {video.description}
            </Text>
          ) : null}
          <View style={styles.tagsContainer}>
            {(video.tags && video.tags.length > 0)
              ? video.tags.map((t: string, i: number) => (
                  <Text key={i} style={styles.tag}>#{t}</Text>
                ))
              : (
                <>
                  <Text style={styles.tag}>#AI</Text>
                  <Text style={styles.tag}>#Tutorial</Text>
                </>
              )
            }
          </View>
        </Animated.View>
      )}
    </View>
  );

  const handleOpenSocial = (platform: 'instagram' | 'linkedin' | 'twitter', handle: string) => {
    let url = '';
    switch (platform) {
      case 'instagram':
        url = `https://instagram.com/${handle}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/in/${handle}`;
        break;
      case 'twitter':
        url = `https://x.com/${handle}`;
        break;
    }
    
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Cannot open URL', `Could not open ${platform} profile`);
      });
    }
  };

  const renderRightContent = () => (
    <View style={isDesktop ? styles.desktopRightContent : styles.rightContent}>
      {/* Social Media Icons - Above Like Button */}
      <View style={isDesktop ? styles.desktopSocialGroup : styles.socialGroup}>
        <TouchableOpacity
          style={isDesktop ? styles.desktopSocialButton : styles.socialButton}
          onPress={() => handleOpenSocial('instagram', video.instagramHandle || video.authorName?.replace(/\s+/g, '').toLowerCase() || 'aigram')}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-instagram" size={isDesktop ? 20 : 28} color="#E1306C" />
        </TouchableOpacity>
        <TouchableOpacity
          style={isDesktop ? styles.desktopSocialButton : styles.socialButton}
          onPress={() => handleOpenSocial('twitter', video.twitterHandle || video.authorName?.replace(/\s+/g, '_').toLowerCase() || 'aigram')}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-x" size={isDesktop ? 20 : 28} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={isDesktop ? styles.desktopSocialButton : styles.socialButton}
          onPress={() => handleOpenSocial('linkedin', video.linkedinHandle || video.authorName?.replace(/\s+/g, '-').toLowerCase() || 'aigram')}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-linkedin" size={isDesktop ? 20 : 28} color="#0A66C2" />
        </TouchableOpacity>
        {/* 3-dot menu hidden */}
      </View>

      <TouchableOpacity
        style={isDesktop ? styles.desktopEngagementButton : styles.engagementButton}
        onPress={handleLike}
      >
        <View style={isDesktop ? styles.desktopIconBg : undefined}>
          <Ionicons
            name={isLiking ? 'heart' : 'heart-outline'}
            size={isDesktop ? 22 : 34}
            color={isLiking ? "#E0245E" : "#FFF"}
          />
        </View>
        <Text style={isDesktop ? styles.desktopEngagementCount : styles.engagementCount}>
          {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={isDesktop ? styles.desktopEngagementButton : styles.engagementButton}>
        <View style={isDesktop ? styles.desktopIconBg : undefined}>
          <Ionicons
            name="chatbubble-outline"
            size={isDesktop ? 22 : 32}
            color="#FFF"
            style={isDesktop ? undefined : { transform: [{ scaleX: -1 }] }}
          />
        </View>
        <Text style={isDesktop ? styles.desktopEngagementCount : styles.engagementCount}>189</Text>
      </TouchableOpacity>

      <TouchableOpacity style={isDesktop ? styles.desktopEngagementButton : styles.engagementButton}>
        <View style={isDesktop ? styles.desktopIconBg : undefined}>
          <Ionicons
            name="bookmark-outline"
            size={isDesktop ? 22 : 32}
            color="#FFF"
          />
        </View>
        <Text style={isDesktop ? styles.desktopEngagementCount : styles.engagementCount}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={isDesktop ? styles.desktopEngagementButton : styles.engagementButton}>
        <View style={isDesktop ? styles.desktopIconBg : undefined}>
          <Ionicons
            name="paper-plane-outline"
            size={isDesktop ? 22 : 32}
            color="#FFF"
          />
        </View>
        <Text style={isDesktop ? styles.desktopEngagementCount : styles.engagementCount}>Share</Text>
      </TouchableOpacity>
    </View>
  );

  const desktopVideoHeight = Math.max(400, windowHeight - 160);
  const desktopVideoWidth = Math.round(desktopVideoHeight * 0.5625);

  if (isDesktop) {
    return (
      <View style={[styles.videoCard, styles.desktopSplitLayer]}>

        {/* Left Column: video player */}
        <TouchableOpacity
          style={[styles.desktopVideoContainer, { width: desktopVideoWidth, height: desktopVideoHeight }]}
          activeOpacity={1}
          onPress={handlePress}
          onPressIn={() => setIsHolding(true)}
          onPressOut={() => setIsHolding(false)}
          delayPressIn={150}
        >
          {isWeb ? (
            webVideoUri ? (
              <View style={StyleSheet.absoluteFill}>
                <video
                  ref={videoRef}
                  src={webVideoUri}
                  style={{
                    position: 'absolute' as const,
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover' as const,
                    backgroundColor: '#000',
                  }}
                  loop
                  playsInline
                  muted={isMuted}
                  preload="auto"
                />
              </View>
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
            )
          ) : (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
          )}
          {showMuteIcon && (
            <View style={styles.centerMuteIcon}>
              <View style={styles.muteIconCircle}>
                <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={48} color="#FFF" />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Right Column: Details Panel */}
        <View style={[styles.desktopDetailsPanel, { height: desktopVideoHeight }]}>
          {/* Header: Avatar, Name, Subscribe */}
          <View style={styles.desktopProfileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{video.authorName?.[0] || video.title?.[0] || 'V'}</Text>
            </View>
            <View style={styles.desktopProfileText}>
              <Text style={styles.desktopProfileName} numberOfLines={1}>@{video.authorName?.replace(/\s+/g, '').toLowerCase() || 'creator'}</Text>
              {/* Social Links */}
              <View style={styles.desktopSocialRow}>
                <TouchableOpacity onPress={() => handleOpenSocial('instagram', video.instagramHandle || video.authorName?.replace(/\s+/g, '').toLowerCase() || 'aigram')}>
                  <Ionicons name="logo-instagram" size={15} color="#E1306C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenSocial('twitter', video.twitterHandle || video.authorName?.replace(/\s+/g, '_').toLowerCase() || 'aigram')}>
                  <Ionicons name="logo-x" size={15} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenSocial('linkedin', video.linkedinHandle || video.authorName?.replace(/\s+/g, '-').toLowerCase() || 'aigram')}>
                  <Ionicons name="logo-linkedin" size={15} color="#0A66C2" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.desktopFollowBtn}>
              <Text style={styles.desktopFollowText}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Details */}
          <ScrollView style={styles.desktopScrollDetails} showsVerticalScrollIndicator={false}>
            <Text style={styles.desktopCardTitle}>
              {video.title || 'Amazing Content'}
            </Text>
            {video.description && (
              <Text style={styles.desktopCardDescription}>
                {video.description}
              </Text>
            )}
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {(video.tags && video.tags.length > 0)
                ? video.tags.map((t: string, i: number) => (
                    <Text key={i} style={styles.desktopTag}>#{t}</Text>
                  ))
                : (
                  <>
                    <Text style={styles.desktopTag}>#AI</Text>
                    <Text style={styles.desktopTag}>#Tutorial</Text>
                  </>
                )
              }
            </View>
          </ScrollView>

          {/* Bottom Actions Row */}
          <View style={styles.desktopActionRow}>
            <TouchableOpacity style={styles.desktopActionBtn} onPress={handleLike}>
              <Ionicons name={isLiking ? 'heart' : 'heart-outline'} size={24} color={isLiking ? '#E0245E' : '#FFF'} />
              <Text style={styles.desktopActionCount}>
                {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.desktopActionBtn}>
              <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
              <Text style={styles.desktopActionCount}>189</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.desktopActionBtn}>
              <Ionicons name="bookmark-outline" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.desktopActionBtn}>
              <Ionicons name="paper-plane-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  }

  // Mobile layout
  return (
    <TouchableOpacity
      style={styles.videoCard}
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={() => setIsHolding(true)}
      onPressOut={() => setIsHolding(false)}
      delayPressIn={150}
    >
      {isWeb ? (
        webVideoUri ? (
          <View style={StyleSheet.absoluteFill}>
            <video
              ref={videoRef}
              src={webVideoUri}
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover' as const,
                backgroundColor: '#000',
              }}
              loop
              playsInline
              muted={isMuted}
              preload="auto"
            />
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
        )
      ) : (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      {/* Center Mute Icon Flash */}
      {showMuteIcon && (
        <View style={styles.centerMuteIcon}>
          <View style={styles.muteIconCircle}>
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-medium"}
              size={48}
              color="#FFF"
            />
          </View>
        </View>
      )}

      {/* Gradients */}
      {!isHolding && (
        <>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
        </>
      )}

      {/* Content */}
      {!isHolding && (
        <View style={[styles.contentWrapper, { paddingBottom: Math.max(bottomInset, 80) + 30 }]}>
          {renderLeftContent()}
          {renderRightContent()}
        </View>
      )}

      {/* Social Handles Edit Modal */}
      <Modal
        visible={showSocialEdit}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSocialEdit(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={styles.socialModalOverlay}>
          <View style={styles.socialModalContent}>
            <View style={styles.socialModalHeader}>
              <Text style={styles.socialModalTitle}>Edit Social Handles</Text>
              <TouchableOpacity onPress={() => setShowSocialEdit(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.socialModalVideoTitle} numberOfLines={1}>
              {video.title}
            </Text>

            <View style={styles.socialInputGroup}>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-instagram" size={22} color="#E1306C" />
                <TextInput
                  style={styles.socialInput}
                  placeholder="Instagram handle (e.g. johndoe)"
                  placeholderTextColor="#666"
                  value={editInstagram}
                  onChangeText={setEditInstagram}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-x" size={22} color="#FFF" />
                <TextInput
                  style={styles.socialInput}
                  placeholder="X / Twitter handle (e.g. johndoe)"
                  placeholderTextColor="#666"
                  value={editTwitter}
                  onChangeText={setEditTwitter}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.socialInputRow}>
                <Ionicons name="logo-linkedin" size={22} color="#0A66C2" />
                <TextInput
                  style={styles.socialInput}
                  placeholder="LinkedIn handle (e.g. johndoe)"
                  placeholderTextColor="#666"
                  value={editLinkedin}
                  onChangeText={setEditLinkedin}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.socialSaveButton, isSavingSocial && { opacity: 0.6 }]}
              onPress={handleSaveSocialHandles}
              disabled={isSavingSocial}
            >
              {isSavingSocial ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.socialSaveButtonText}>Save Handles</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </TouchableOpacity>
  );
};

export default function VideoFeed({
  searchParams,
  onVideoPress,
  onVideoLike,
}: VideoFeedProps) {
  const tabBarHeight = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [feedLayout, setFeedLayout] = useState({ width, height });
  const availableVideoWidth = feedLayout.width || width;
  const rawFeedHeight = feedLayout.height || height;
  // Use rawFeedHeight directly because the custom FloatingNavbar is absolute! 
  // Subtracting tabBarHeight leaves a massive empty gap at the bottom of the feed.
  const availableVideoHeight = Math.max(0, rawFeedHeight);
  const flatListRef = React.useRef<FlatList<Video>>(null);

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);

  const viewabilityConfigParams = React.useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  useEffect(() => {
    loadVideos(true);
  }, [searchParams]);

  const loadVideos = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setCurrentPage(0);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const page = refresh ? 0 : currentPage + 1;
      const params = {
        ...searchParams,
        page,
        size: 10,
      };

      const response = await videoService.getVideoFeed(params);

      if (response.success && response.data && response.data.content) {
        const newVideos = response.data.content;

        if (refresh) {
          setVideos(newVideos);
        } else {
          setVideos(prev => [...(prev || []), ...newVideos]);
        }

        setCurrentPage(page);
        setHasMore(!response.data.last);
      } else {
        if (refresh) {
          setVideos([]);
        }
        throw new Error(response?.message || 'Failed to load videos');
      }
    } catch (error: any) {
      console.error('Error loading videos:', error);
      setError(error.message || 'Failed to load videos');

      if (!refresh && currentPage > 0) {
        Alert.alert('Error', 'Failed to load more videos');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadVideos(true);
  }, [searchParams]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadVideos(false);
    }
  }, [isLoadingMore, hasMore, currentPage]);

  const handleVideoPress = (video: Video) => {
    onVideoPress?.(video);
  };

  const handleVideoLike = (video: Video) => {
    onVideoLike?.(video);
  };

  const handleFeedLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
    if (layoutWidth > 0 && layoutHeight > 0) {
      setFeedLayout({ width: layoutWidth, height: layoutHeight });
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (availableVideoHeight <= 0) return;
      const offsetY = event.nativeEvent.contentOffset.y;
      const targetIndex = Math.round(offsetY / availableVideoHeight);
      const targetOffset = targetIndex * availableVideoHeight;
      if (Math.abs(offsetY - targetOffset) > 1) {
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }
    },
    [availableVideoHeight]
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    if (videos && videos.length > 0) return null;

    return (
      <View style={[styles.emptyContainer, { minHeight: availableVideoHeight }]}>
        <Ionicons name="document-text-outline" size={64} color="#FFF" />
        <Text style={styles.emptyTitle}>No Content</Text>
        <Text style={styles.emptyText}>
          {error ? error : 'No videos to display'}
        </Text>
      </View>
    );
  };

  if (isLoading && (!videos || videos.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleFeedLayout}>
      <FlatList
        ref={flatListRef}
        data={videos}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfigParams}
        renderItem={({ item, index }) => (
          <View style={{
            height: availableVideoHeight,
            width: availableVideoWidth,
          }}>
            <VideoCard
              video={item}
              isActive={index === activeIndex}
              onPress={handleVideoPress}
              onLike={handleVideoLike}
              bottomInset={tabBarHeight}
              isMuted={isGlobalMuted}
              onToggleMute={() => setIsGlobalMuted(!isGlobalMuted)}
            />
          </View>
        )}
        keyExtractor={(item) => item.videoId}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        pagingEnabled={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={availableVideoHeight}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        bounces={false}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={!isWeb}
        maxToRenderPerBatch={isWeb ? 3 : 2}
        windowSize={isWeb ? 5 : 3}
        initialNumToRender={isWeb ? 2 : 1}
        contentContainerStyle={!videos || videos.length === 0 ? styles.emptyContentContainer : undefined}
        scrollsToTop={false}
        nestedScrollEnabled={false}
        getItemLayout={(data, index) => ({
          length: availableVideoHeight,
          offset: availableVideoHeight * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D12',
  },
  videoCard: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopSplitLayer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    gap: 32,
  },
  desktopVideoContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }
    }) as any,
  },
  desktopDetailsPanel: {
    width: 380,
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }
    }) as any,
  },
  desktopProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C35',
    marginBottom: 20,
  },
  desktopProfileText: {
    flex: 1,
    marginLeft: 12,
  },
  desktopProfileName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  desktopSocialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  desktopFollowBtn: {
    backgroundColor: '#E0245E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  desktopFollowText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  desktopScrollDetails: {
    flex: 1,
  },
  desktopCardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 26,
  },
  desktopCardDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  desktopTag: {
    color: '#1BCC8F',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    marginBottom: 8,
  },
  desktopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C35',
    marginTop: 16,
  },
  desktopActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  desktopActionCount: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  webVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 2,
  },
  centerMuteIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
    pointerEvents: 'none',
  },
  muteIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
    zIndex: 2,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  leftContent: {
    flex: 1,
    justifyContent: 'flex-end',
    marginRight: 16,
    paddingBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  socialIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 2,
  },
  socialIconInline: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1BCC8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  creatorDetails: {
    flexShrink: 1,
  },
  creatorName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  followBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  followText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  rightContent: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 0,
  },
  engagementButton: {
    alignItems: 'center',
    gap: 4,
  },
  engagementCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Social Media Buttons
  socialGroup: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  desktopSocialGroup: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  desktopSocialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  desktopEngagementButton: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  desktopEngagementCount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  // Social Handles Edit Modal
  socialModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    // Let KeyboardAvoidingView push the content up
  },
  socialModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  socialModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  socialModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  socialModalVideoTitle: {
    color: '#999',
    fontSize: 13,
    marginBottom: 20,
  },
  socialInputGroup: {
    gap: 14,
    marginBottom: 20,
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
  },
  socialInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 10,
  },
  socialSaveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialSaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

