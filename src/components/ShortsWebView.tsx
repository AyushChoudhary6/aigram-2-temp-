import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video } from '../types';

interface ShortsWebViewProps {
  videos: Video[];
  onVideoPress?: (video: Video) => void;
  onVideoLike?: (video: Video) => void;
}

/**
 * YouTube Shorts-style vertical video feed using WebView
 * 
 * This component loads shorts.html which provides:
 * - Proper autoplay handling for iOS/Android
 * - IntersectionObserver-based visibility detection
 * - CSS scroll-snap for smooth paging
 * - Lifecycle management (background/foreground)
 * 
 * Why WebView?
 * - expo-av has issues with rapid index changes
 * - HTML5 <video> element has proven autoplay behavior
 * - IntersectionObserver naturally handles visibility in WebView
 * - Avoids platform-specific FlatList pagination quirks
 */
const ShortsWebView: React.FC<ShortsWebViewProps> = ({
  videos,
  onVideoPress,
  onVideoLike,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert local require() URLs to file:// URIs
  const processedVideos = videos.map((video) => {
    let videoUrl = video.videoUrl || video.streamUrl;

    // If it's a number (require() result), fetch the actual URI
    if (typeof videoUrl === 'number') {
      // For Expo: use require() path directly in WebView
      // The WebView can access require() resources
      return {
        ...video,
        url: video.title || `video_${Math.random()}`,
      };
    }

    return {
      ...video,
      url: videoUrl,
    };
  });

  // Prepare video data for WebView
  const videosScript = `
    window.SHORTS_VIDEOS = ${JSON.stringify(
      processedVideos.map((v, idx) => ({
        id: idx,
        url: v.url,
        title: v.title || 'Untitled Video',
        creator: v.title || 'Creator',
        description: v.description || '',
      }))
    )};
    
    // Notify that videos are loaded
    if (window.onVideosReady) {
      window.onVideosReady();
    }
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      console.log('[ShortsWebView] Message from WebView:', message);

      switch (message.type) {
        case 'VIDEO_CLICKED':
          // Video item tapped
          if (onVideoPress && processedVideos[message.videoIndex]) {
            onVideoPress(videos[message.videoIndex]);
          }
          break;

        case 'LIKE_TOGGLED':
          // Like button pressed
          if (onVideoLike && videos[message.videoIndex]) {
            onVideoLike(videos[message.videoIndex]);
          }
          break;

        case 'SOUND_TOGGLED':
          console.log('[ShortsWebView] Sound toggled to:', message.isMuted);
          break;

        case 'DEBUG':
          console.log('[ShortsWebView] Debug:', message.data);
          break;

        default:
          console.warn('[ShortsWebView] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[ShortsWebView] Error parsing message:', error);
    }
  };

  const handleLoadStart = () => {
    console.log('[ShortsWebView] Loading started');
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    console.log('[ShortsWebView] Loading completed');
    setIsLoading(false);

    // Inject video data once HTML is loaded
    webViewRef.current?.injectJavaScript(videosScript);
  };

  const handleError = (error: any) => {
    console.error('[ShortsWebView] WebView error:', error);
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={require('../web/shorts.html')}
        style={styles.webview}
        scrollEnabled={false}
        // Critical for autoplay in WebView
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // WebView configuration
        scalesPageToFit={false}
        containerStyle={styles.webviewContainer}
        // Event handlers
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onMessage={handleWebViewMessage}
        // JavaScript injection
        injectedJavaScript={`
          (function() {
            // Expose postMessage to WebView
            window.postToNative = function(message) {
              // Post to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(message));
              }
            };
            
            // Notify that bridge is ready
            console.log('[WebView] Native bridge ready');
          })();
        `}
        // iOS specific
        {...(Platform.OS === 'ios' && {
          scrollEnabled: false,
          bounces: false,
          decelerationRate: 'normal',
        })}
        // Android specific
        {...(Platform.OS === 'android' && {
          hardwareAccelerationEnabled: true,
          javaScriptEnabledAndroid: true,
        })}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0B0B0B" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});

export default ShortsWebView;


