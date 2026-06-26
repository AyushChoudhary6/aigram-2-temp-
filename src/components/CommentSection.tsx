import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { videoService } from '../services/videoService';
import { useAuth } from '../context/AppContext';
import { Comment, CommentRequest, PaginatedResponse } from '../types';

interface CommentSectionProps {
  videoId: string;
  onCommentAdded?: (comment: Comment) => void;
}

interface CommentItemProps {
  comment: Comment;
  onReply?: (comment: Comment) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply }) => {
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.authorAvatar}>
          <Text style={styles.avatarText}>
            {comment.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.authorName}>{comment.authorName}</Text>
          <Text style={styles.commentTime}>
            {formatTimeAgo(comment.createdAt)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReply?.(comment)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#555555" />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.commentId}
              comment={reply}
              onReply={onReply}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default function CommentSection({ videoId, onCommentAdded }: CommentSectionProps) {
  const { user, isGuestUser } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComments(true);
  }, [videoId]);

  const loadComments = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setCurrentPage(0);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const page = refresh ? 0 : currentPage + 1;
      const response = await videoService.getComments(videoId, page, 20);
      
      if (response.success) {
        const newComments = response.data.content;
        
        if (refresh) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }
        
        setCurrentPage(page);
        setHasMore(!response.data.last);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error);
      setError(error.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to post comments',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData: CommentRequest = {
        videoId,
        content: newComment.trim(),
        parentCommentId: replyingTo?.commentId,
      };

      const response = await videoService.addComment(commentData);
      
      if (response.success) {
        const newCommentObj = response.data;
        
        if (replyingTo) {
          // Add as reply
          setComments(prev => prev.map(comment => {
            if (comment.commentId === replyingTo.commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newCommentObj]
              };
            }
            return comment;
          }));
        } else {
          // Add as new comment
          setComments(prev => [newCommentObj, ...prev]);
        }
        
        setNewComment('');
        setReplyingTo(null);
        onCommentAdded?.(newCommentObj);
        
        Alert.alert('Success', 'Comment posted successfully!');
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', error.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.authorName} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadComments(false);
    }
  };

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <CommentItem comment={item} onReply={handleReply} />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#00D084" />
        <Text style={styles.loadingText}>Loading more comments...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color="#555555" />
        <Text style={styles.emptyTitle}>No Comments Yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share your thoughts about this video!
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>
        Comments ({comments.length})
      </Text>
    </View>
  );

  if (isLoading && comments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.commentId}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        style={styles.commentsList}
      />

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyText}>
              Replying to {replyingTo.authorName}
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Ionicons name="close" size={20} color="#555555" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'G'}
            </Text>
          </View>
          
          <TextInput
            style={styles.textInput}
            placeholder={isGuestUser() ? "Login to comment..." : "Add a comment..."}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!isGuestUser() && !isSubmitting}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || isSubmitting || isGuestUser()) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting || isGuestUser()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {newComment.length > 0 && (
          <Text style={styles.characterCount}>
            {newComment.length}/500
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888888',
  },
  commentsList: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D084',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0B0B0B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  commentTime: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 44,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#1A1A1A',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    backgroundColor: '#0B0B0B',
    padding: 16,
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161616',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyText: {
    fontSize: 14,
    color: '#888888',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D084',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundcolor: '#888888',
  },
  characterCount: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'right',
    marginTop: 4,
  },
});

