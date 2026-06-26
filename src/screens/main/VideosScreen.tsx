import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AppContext';
import VideoFeed from '../../components/VideoFeed';
import VideoPlayer from '../../components/VideoPlayer';
import CommentSection from '../../components/CommentSection';
import VideoUpload from '../../components/VideoUpload';
import { Video } from '../../types';

export default function VideosScreen() {
  const { user, isGuestUser } = useAuth();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const handleVideoLike = (video: Video) => {
    // Video like handled by VideoFeed component
    console.log('Video liked:', video.videoId);
  };

  const handleUploadPress = () => {
    if (isGuestUser()) {
      // Show guest upgrade prompt
      return;
    }
    setShowUploadModal(true);
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const handleShowComments = () => {
    if (selectedVideo) {
      setShowComments(true);
    }
  };

  const handleCommentAdded = () => {
    // Refresh video data if needed
    console.log('Comment added');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Videos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
          {!isGuestUser() && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleUploadPress}
            >
              <Ionicons name="add" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Video Feed */}
      <VideoFeed
        key={refreshKey}
        onVideoPress={handleVideoPress}
        onVideoLike={handleVideoLike}
      />

      {/* Video Player Modal */}
      <Modal
        visible={showVideoPlayer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowVideoPlayer(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Video Player Header */}
          <View style={styles.playerHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowVideoPlayer(false)}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commentsButton}
              onPress={handleShowComments}
            >
              <Ionicons name="chatbubble" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Video Player */}
          {selectedVideo && (
            <VideoPlayer
              video={selectedVideo}
              autoPlay={true}
              showControls={true}
              onVideoEnd={() => {
                // Handle video end - maybe show next video
              }}
              onError={(error) => {
                console.error('Video player error:', error);
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Comments Header */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowComments(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          {selectedVideo && (
            <CommentSection
              videoId={selectedVideo.videoId}
              onCommentAdded={handleCommentAdded}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Upload Header */}
          <View style={styles.uploadHeader}>
            <Text style={styles.uploadTitle}>Upload Video</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Video Upload Component */}
          <VideoUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B0B0B',
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  playerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    padding: 8,
  },
  commentsButton: {
    padding: 8,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  closeButton: {
    padding: 8,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
});


