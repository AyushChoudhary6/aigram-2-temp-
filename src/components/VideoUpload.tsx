import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { videoService } from '../services/videoService';
import { useAuth } from '../context/AppContext';
import { VideoUploadRequest, VideoUploadResponse } from '../types';

interface VideoUploadProps {
  onUploadComplete?: (response: VideoUploadResponse) => void;
  onUploadError?: (error: string) => void;
}

export default function VideoUpload({ onUploadComplete, onUploadError }: VideoUploadProps) {
  const { user, isGuestUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('EDUCATIONAL');
  const [tags, setTags] = useState('');

  // Check if user can upload videos
  const canUpload = user && !isGuestUser();

  const genres = [
    { id: 'EDUCATIONAL', name: 'Educational' },
    { id: 'ENTERTAINMENT', name: 'Entertainment' },
    { id: 'TECHNOLOGY', name: 'Technology' },
    { id: 'LIFESTYLE', name: 'Lifestyle' },
    { id: 'BUSINESS', name: 'Business' },
  ];

  const handleUpload = async () => {
    if (!videoUrl.trim()) {
      Alert.alert('Missing Video URL', 'Please enter a video URL');
      return;
    }

    if (!videoTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a video title');
      return;
    }

    if (!canUpload) {
      Alert.alert('Upload Restricted', 'Guest users cannot upload videos. Please register to upload content.');
      return;
    }

    try {
      setIsUploading(true);

      const uploadData: VideoUploadRequest = {
        videoUrl: videoUrl.trim(),
        title: videoTitle.trim(),
        description: videoDescription.trim(),
        genre: selectedGenre as any,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        visibility: 'PUBLIC',
      };

      const response = await videoService.uploadVideoFromUrl(uploadData);

      if (response.success) {
        Alert.alert('Upload Successful', 'Your video has been uploaded successfully!');
        
        // Reset form
        setVideoUrl('');
        setVideoTitle('');
        setVideoDescription('');
        setTags('');
        setSelectedGenre('EDUCATIONAL');
        
        onUploadComplete?.(response.data);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload video';
      Alert.alert('Upload Failed', errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setVideoUrl('');
    setVideoTitle('');
    setVideoDescription('');
    setTags('');
    setSelectedGenre('EDUCATIONAL');
  };

  if (!canUpload) {
    return (
      <View style={styles.container}>
        <View style={styles.restrictedContainer}>
          <Ionicons name="lock-closed" size={48} color="#dc3545" />
          <Text style={styles.restrictedTitle}>Upload Restricted</Text>
          <Text style={styles.restrictedText}>
            Guest users cannot upload videos. Please register to upload and share your content.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.uploadArea}>
        <View style={styles.header}>
          <Ionicons name="videocam" size={32} color="#00D084" />
          <Text style={styles.title}>Upload Video</Text>
        </View>
        
        {/* Video URL Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Video URL *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://example.com/video.mp4"
            value={videoUrl}
            onChangeText={setVideoUrl}
            editable={!isUploading}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            Enter a direct link to your video file (MP4, WebM, etc.)
          </Text>
        </View>

        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter video title"
            value={videoTitle}
            onChangeText={setVideoTitle}
            editable={!isUploading}
            maxLength={100}
          />
          <Text style={styles.characterCount}>
            {videoTitle.length}/100
          </Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your video..."
            value={videoDescription}
            onChangeText={setVideoDescription}
            editable={!isUploading}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {videoDescription.length}/500
          </Text>
        </View>

        {/* Genre Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreContainer}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={[
                  styles.genreButton,
                  selectedGenre === genre.id && styles.genreButtonActive
                ]}
                onPress={() => setSelectedGenre(genre.id)}
                disabled={isUploading}
              >
                <Text style={[
                  styles.genreButtonText,
                  selectedGenre === genre.id && styles.genreButtonTextActive
                ]}>
                  {genre.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tags Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Tags</Text>
          <TextInput
            style={styles.textInput}
            placeholder="tag1, tag2, tag3"
            value={tags}
            onChangeText={setTags}
            editable={!isUploading}
            autoCapitalize="none"
          />
          <Text style={styles.inputHint}>
            Separate tags with commas to help people find your video
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={isUploading}
          >
            <Ionicons name="refresh" size={16} color="#555555" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!videoUrl.trim() || !videoTitle.trim() || isUploading) && styles.uploadButtonDisabled
            ]}
            onPress={handleUpload}
            disabled={!videoUrl.trim() || !videoTitle.trim() || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={16} color="white" />
                <Text style={styles.uploadButtonText}>Upload Video</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Guidelines */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Upload Guidelines</Text>
        <View style={styles.guidelinesList}>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.guidelineText}>Use direct video file URLs (MP4, WebM, AVI, MOV)</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.guidelineText}>Ensure your video is publicly accessible</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.guidelineText}>Content must comply with community guidelines</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.guidelineText}>Add descriptive titles and tags for better discovery</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
  },
  uploadArea: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginLeft: 12,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#E8F5E8',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  textArea: {
    minHeight: 100,
  },
  inputHint: {
    fontSize: 12,
    color: '#555555',
    marginTop: 4,
    lineHeight: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'right',
    marginTop: 4,
  },
  genreContainer: {
    flexDirection: 'row',
  },
  genreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161616',
    marginRight: 8,
  },
  genreButtonActive: {
    backgroundColor: '#00D084',
    borderColor: '#00D084',
  },
  genreButtonText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '500',
  },
  genreButtonTextActive: {
    color: '#E8F5E8',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '600',
    marginLeft: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00D084',
    flex: 2,
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#555555',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#E8F5E8',
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E8F5E8',
  },
  guidelinesList: {
    gap: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guidelineText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  restrictedContainer: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 12,
  },
  restrictedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555555',
    lineHeight: 24,
  },
});

