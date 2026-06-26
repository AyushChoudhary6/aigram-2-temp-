import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { User } from '../../types';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { DEBUG_CONFIG } from '../../constants';
import VideoFeed from '../../components/VideoFeed';
import GlobalSearchBar from '../../components/GlobalSearchBar';
import { awsVideoUploadService } from '../../services/awsVideoUploadService';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  user: User;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user }) => {
  const insets = useSafeAreaInsets();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handlePickVideo = async () => {
    try {
      setUploadError('');
      const videoFile = await awsVideoUploadService.pickVideoFile();
      
      if (videoFile) {
        // Validate file
        if (!videoFile.uri) {
          setUploadError('Invalid video file selected');
          return;
        }
        
        // Check file size (max 1GB)
        const maxSizeBytes = 1024 * 1024 * 1024; // 1GB
        if (videoFile.size && videoFile.size > maxSizeBytes) {
          setUploadError('Video file is too large. Max size: 1GB');
          return;
        }
        
        setSelectedVideo(videoFile);
      } else {
        if (DEBUG_CONFIG.API_CALLS) {
          console.log('No video selected');
        }
      }
    } catch (error: any) {
      console.error('Error picking video:', error);
      const errorMessage = error?.message || 'Failed to pick video file';
      setUploadError(errorMessage);
      
      // Show alert for critical errors
      if (error?.message?.includes('permission')) {
        Alert.alert(
          'Permission Denied',
          'Please grant file access permissions to upload videos.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleUploadVideo = async () => {
    if (!uploadTitle.trim()) {
      setUploadError('Please enter a video title');
      return;
    }

    if (!selectedVideo) {
      setUploadError('Please select a video file');
      return;
    }

    if (!user?.userId) {
      setUploadError('User authentication required. Please login first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadError('');

    try {
      await awsVideoUploadService.uploadVideo(
        user.userId,
        {
          title: uploadTitle,
          description: uploadDescription,
          userId: user.userId,
          tags,
        },
        selectedVideo,
        (status, progress) => {
          setUploadStatus(status);
          if (progress) {
            setUploadProgress(progress.percentage);
          }
        },
        'home screen videos'
      );

      // Success
      setUploadStatus('Upload complete!');
      
      // Refresh feed after a short delay
      setTimeout(() => {
        handleCloseUpload();
        setFeedKey(prev => prev + 1);
        Alert.alert('Success', 'Video uploaded successfully to AWS!');
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
      setUploadError(errorMessage);
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUpload = () => {
    setShowUploadDialog(false);
    setUploadTitle('');
    setUploadDescription('');
    setTags([]);
    setTagInput('');
    setSelectedVideo(null);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadError('');
  };

  const handleUploadSuccess = () => {
    setFeedKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* Full-screen Video Feed (Reels style) */}
      <View style={styles.videoFeedContainer}>
        <VideoFeed key={feedKey} />
      </View>

      {/* Header overlay - App name like Instagram Reels */}
      <View style={[styles.headerOverlay, { top: Math.max(insets.top, 20) }]}>
        {/* <Text style={styles.headerTitle}>Reels</Text> */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setShowUploadDialog(true)}
        >
          <Ionicons name="camera-outline" size={26} color="#FFF" />
        </TouchableOpacity>
        <GlobalSearchBar />
      </View>

      {/* Upload Dialog */}
      <Modal
        visible={showUploadDialog}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={handleCloseUpload}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Your Story</Text>
            <TouchableOpacity onPress={handleCloseUpload} style={styles.modalCloseButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Upload Zone */}
            <TouchableOpacity 
              style={styles.uploadZone} 
              activeOpacity={0.7}
              onPress={handlePickVideo}
              disabled={isUploading}
            >
              <Ionicons 
                name={selectedVideo ? "checkmark-circle" : "cloud-upload-outline"} 
                size={40} 
                color={selectedVideo ? COLORS.primary : COLORS.primary} 
              />
              <Text style={styles.uploadZoneTitle}>
                {selectedVideo ? selectedVideo.name : 'Click to upload video'}
              </Text>
              <Text style={styles.uploadZoneSubtitle}>
                {selectedVideo ? `${(selectedVideo.size! / (1024 * 1024)).toFixed(2)} MB` : 'MP4, AVI, MOV, WebM up to 1GB'}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Give your video a catchy title"
                placeholderTextColor={COLORS.mutedForeground}
                value={uploadTitle}
                onChangeText={setUploadTitle}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextArea]}
                placeholder="What's your video about?"
                placeholderTextColor={COLORS.mutedForeground}
                value={uploadDescription}
                onChangeText={setUploadDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Tags */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tags (up to 5)</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add a tag"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.tagAddButton} onPress={handleAddTag}>
                  <Text style={styles.tagAddButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsList}>
                  {tags.map(tag => (
                    <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => handleRemoveTag(tag)}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <Ionicons name="close" size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Error Display */}
            {uploadError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{uploadError}</Text>
              </View>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>{uploadStatus}</Text>
                  <Text style={styles.progressPercent}>{uploadProgress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${uploadProgress}%` }
                    ]} 
                  />
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity 
              style={[styles.submitButton, isUploading && styles.submitButtonDisabled]} 
              activeOpacity={0.85}
              onPress={handleUploadVideo}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.primaryForeground} />
                  <Text style={styles.submitButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="star" size={16} color={COLORS.primaryForeground} />
                  <Text style={styles.submitButtonText}>Share Your Story</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoFeedContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  uploadZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.06,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  uploadZoneTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  uploadZoneSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  required: {
    color: COLORS.primary,
  },
  fieldInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.foreground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    minHeight: 48,
  },
  fieldTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.foreground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    minHeight: 48,
  },
  tagAddButton: {
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddButtonText: {
    color: COLORS.foreground,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  tagChipText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    minHeight: 52,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.sm,
    ...SHADOWS.glow,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.primaryForeground,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fecaca',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: BORDER_RADIUS.md,
  },
  errorText: {
    flex: 1,
    color: '#991b1b',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  progressContainer: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    color: COLORS.foreground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  progressPercent: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
});

export default HomeScreen;
