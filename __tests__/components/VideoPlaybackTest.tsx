import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import VideoPlayer from '../../src/components/VideoPlayer';
import { videoService } from '../../src/services/videoService';
import { practiceVideoService } from '../../src/services/practiceVideoService';
import { Video } from '../../src/types';

/**
 * Video Playback Test Component
 * This component is ONLY for validation testing and should NOT ship to production
 */

interface TestResult {
  service: string;
  success: boolean;
  error?: string;
  streamUrl?: string;
  isLocal?: boolean;
  isCloud?: boolean;
  provider?: string;
}

export default function VideoPlaybackTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Demo video data for testing
  const demoVideo: Video = {
    videoId: 'demo-stream',
    title: 'Demo Video - Kabhi Na Kabhi',
    description: 'Local demo video for testing video playback functionality',
    authorId: 'demo-user',
    genre: 'test',
    tags: ['demo', 'test'],
    duration: 0,
    viewCount: 0,
    likeCount: 0,
    status: 'APPROVED',
    visibility: 'PUBLIC',
    createdAt: new Date().toISOString(),
    thumbnailUrl: '',
    // These will be overridden by the demo configuration
    videoUrl: undefined,
    videoPath: undefined
  };

  const demoPracticeQuestion = {
    questionId: 'demo-practice',
    title: 'Demo Practice Question',
    description: 'Practice video question for testing',
    difficulty: 'EASY' as const,
    category: 'test',
    tags: ['demo', 'practice']
  };

  useEffect(() => {
    // Check if demo mode is enabled
    const isDemoEnabled = process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEMO_VIDEO === 'true';
    if (!isDemoEnabled) {
      Alert.alert(
        'Demo Mode Disabled',
        'To enable demo video testing, set REACT_APP_DEMO_VIDEO=true in your environment variables.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const testVideoStreamService = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing VideoStream Service with demo video');
      
      const streamResponse = await videoService.getStreamUrl('demo-stream', '720p');
      
      const result: TestResult = {
        service: 'VideoStream Service',
        success: streamResponse.success,
        error: streamResponse.success ? undefined : streamResponse.message,
        streamUrl: streamResponse.data?.streamUrl,
        isLocal: streamResponse.data?.isLocal,
        isCloud: streamResponse.data?.isCloud,
        provider: streamResponse.data?.provider
      };

      setTestResults(prev => [...prev, result]);

      if (streamResponse.success) {
        setCurrentVideo(demoVideo);
        console.log('✅ VideoStream Service test passed:', result);
      } else {
        console.error('❌ VideoStream Service test failed:', result);
        Alert.alert('Test Failed', `VideoStream Service: ${result.error}`);
      }
    } catch (error) {
      const result: TestResult = {
        service: 'VideoStream Service',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => [...prev, result]);
      console.error('❌ VideoStream Service test error:', error);
      Alert.alert('Test Error', `VideoStream Service: ${result.error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPracticeVideoService = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing Practice Video Service with demo video');
      
      const streamResponse = await practiceVideoService.getVideoStreamUrl('demo-practice', '720p');
      
      const result: TestResult = {
        service: 'Practice Video Service',
        success: streamResponse.success,
        error: streamResponse.success ? undefined : streamResponse.message,
        streamUrl: streamResponse.data?.streamUrl,
        isLocal: streamResponse.data?.isLocal,
        isCloud: streamResponse.data?.isCloud,
        provider: streamResponse.data?.provider
      };

      setTestResults(prev => [...prev, result]);

      if (streamResponse.success) {
        // Create a video object for the practice question
        const practiceVideo: Video = {
          ...demoVideo,
          videoId: 'demo-practice',
          title: 'Demo Practice Video - Kabhi Na Kabhi',
          description: 'Practice video question demo for testing'
        };
        setCurrentVideo(practiceVideo);
        console.log('✅ Practice Video Service test passed:', result);
      } else {
        console.error('❌ Practice Video Service test failed:', result);
        Alert.alert('Test Failed', `Practice Video Service: ${result.error}`);
      }
    } catch (error) {
      const result: TestResult = {
        service: 'Practice Video Service',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => [...prev, result]);
      console.error('❌ Practice Video Service test error:', error);
      Alert.alert('Test Error', `Practice Video Service: ${result.error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentVideo(null);
  };

  const renderTestResult = (result: TestResult, index: number) => (
    <View key={index} style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
      <Text style={styles.serviceName}>{result.service}</Text>
      <Text style={[styles.status, result.success ? styles.successText : styles.errorText]}>
        {result.success ? '✅ PASS' : '❌ FAIL'}
      </Text>
      {result.error && (
        <Text style={styles.errorMessage}>Error: {result.error}</Text>
      )}
      {result.success && (
        <View style={styles.resultDetails}>
          <Text style={styles.detailText}>Stream URL: {result.streamUrl?.substring(0, 50)}...</Text>
          <Text style={styles.detailText}>Is Local: {result.isLocal ? 'Yes' : 'No'}</Text>
          <Text style={styles.detailText}>Is Cloud: {result.isCloud ? 'Yes' : 'No'}</Text>
          {result.provider && (
            <Text style={styles.detailText}>Provider: {result.provider}</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 Video Playback Test</Text>
        <Text style={styles.subtitle}>Demo Video: Kabhi_Na_Kabhi_720p.mp4</Text>
        <Text style={styles.warning}>⚠️ FOR VALIDATION ONLY - NOT FOR PRODUCTION</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.testButton, styles.videoStreamButton]}
          onPress={testVideoStreamService}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test VideoStream Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.practiceVideoButton]}
          onPress={testPracticeVideoService}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Practice Video Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.clearButton]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Running test...</Text>
        </View>
      )}

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map(renderTestResult)}
        </View>
      )}

      {currentVideo && (
        <View style={styles.videoContainer}>
          <Text style={styles.videoTitle}>Video Player Test:</Text>
          <VideoPlayer
            video={currentVideo}
            autoPlay={false}
            showControls={true}
            onVideoEnd={() => console.log('🎬 Video playback ended')}
            onError={(error) => {
              console.error('🎬 Video playback error:', error);
              Alert.alert('Video Error', error);
            }}
          />
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>
          1. Ensure REACT_APP_DEMO_VIDEO=true is set in your environment
        </Text>
        <Text style={styles.instructionText}>
          2. Verify the demo video file exists at the specified path
        </Text>
        <Text style={styles.instructionText}>
          3. Test both services to validate video source resolution
        </Text>
        <Text style={styles.instructionText}>
          4. Check video player functionality (play, pause, seek)
        </Text>
        <Text style={styles.instructionText}>
          5. Verify no UI layout changes occur during playback
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  warning: {
    fontSize: 14,
    color: '#ff6b35',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  testButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoStreamButton: {
    backgroundColor: '#007bff',
  },
  practiceVideoButton: {
    backgroundColor: '#28a745',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  errorCard: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
  errorMessage: {
    fontSize: 12,
    color: '#721c24',
    marginTop: 5,
  },
  resultDetails: {
    marginTop: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 2,
  },
  videoContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructions: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10,
  },
});
