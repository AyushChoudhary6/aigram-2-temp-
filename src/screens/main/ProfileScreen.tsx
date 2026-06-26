import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { User, WalletTransaction, CoinPackage } from '../../types';
import { COLORS, GRADIENTS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import { awsVideoUploadService } from '../../services/awsVideoUploadService';
import MediaGrid, { MediaItem } from '../../components/MediaGrid';
import VideoPlayerModal, { VideoPlaylistItem } from '../../components/VideoPlayerModal';

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
}

interface TokenPackage {
  tokens: number;
  price: number;
  bonus: number;
  popular: boolean;
}

interface CreatorProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  followers: number;
  following: number;
  impressions: number;
  problemsCreated: number;
  problemsSolved: number;
  posts: { id: string; thumbnail: string; likes: number; comments: number }[];
}

interface ProfileScreenProps {
  user: User;
  onLogout?: () => void;
}

const formatCount = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "wallet">("posts");
  const [showSearch, setShowSearch] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddTokens, setShowAddTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CreatorProfile | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  // State for API data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [userTokens, setUserTokens] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<CreatorProfile[]>([]);
  const [profilePhotos, setProfilePhotos] = useState<any[]>([]);
  const [profileVideos, setProfileVideos] = useState<any[]>([]);

  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [allMedia, setAllMedia] = useState<VideoPlaylistItem[]>([]);

  useEffect(() => {
    loadProfileData();
    loadUserProfileMedia();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load wallet data
      const walletResponse = await userService.getWallet();
      if (walletResponse.success && walletResponse.data) {
        setUserTokens(walletResponse.data.balance);
      }

      // Load transactions
      const txResponse = await userService.getWalletTransactions(0, 10);
      if (txResponse.success && txResponse.data?.content) {
        setTransactions(txResponse.data.content.map((tx: WalletTransaction) => ({
          id: tx.transactionId,
          type: tx.type === 'CREDIT' ? 'credit' as const : 'debit' as const,
          amount: tx.amount,
          description: tx.description || tx.reason,
          date: new Date(tx.createdAt).toLocaleDateString(),
        })));
      }

      // Load token packages
      const packagesResponse = await paymentService.getPackages();
      if (packagesResponse.success && packagesResponse.data) {
        setTokenPackages(packagesResponse.data.map((pkg: CoinPackage) => ({
          tokens: pkg.coins,
          price: pkg.price,
          bonus: 0,
          popular: pkg.popular || false,
        })));
      }

      // Load user statistics
      const statsResponse = await userService.getUserStatistics();
      if (statsResponse.success && statsResponse.data) {
        setUserStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const loadUserProfileMedia = async () => {
    try {
      const photosResponse = await awsVideoUploadService.getFolderVideos(`profile/${user.userId}/photos`);
      setProfilePhotos(photosResponse || []);
      
      const videosResponse = await awsVideoUploadService.getUserVideos(user.userId);
      setProfileVideos(videosResponse || []);
    } catch (error) {
      console.error('Error loading profile media:', error);
    }
  };

  // Update allMedia when photos or videos change
  useEffect(() => {
    const combined: VideoPlaylistItem[] = [];
    
    if (profileVideos && profileVideos.length > 0) {
      profileVideos.forEach((video) => {
        combined.push({
          id: video.id || video.videoId,
          type: 'video',
          mediaUrl: video.blobUrl,
          blobUrl: video.blobUrl,
          title: video.title || video.originalName,
          originalName: video.originalName,
        });
      });
    }

    if (profilePhotos && profilePhotos.length > 0) {
      profilePhotos.forEach((photo) => {
        combined.push({
          id: photo.id || photo.videoId,
          type: 'image',
          mediaUrl: photo.blobUrl,
          blobUrl: photo.blobUrl,
          title: photo.title || photo.originalName,
          originalName: photo.originalName,
        });
      });
    }

    setAllMedia(combined);
  }, [profileVideos, profilePhotos]);

  const handleMediaPress = (item: MediaItem, index: number) => {
    setSelectedMediaIndex(index);
    setShowVideoPlayer(true);
  };

  const handleMediaIndexChange = (newIndex: number) => {
    setSelectedMediaIndex(newIndex);
  };

  const handleUploadPhoto = async () => {
    try {
      setUploadError('');
      const file = await awsVideoUploadService.pickImageFile();
      if (!file) {
        setUploadError('No file selected');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Uploading photo...');

      const folderPath = `profile/${user.userId}/photos`;
      // Note: Using uploadVideo method since the backend accepts any file for now
      // In future, you might want a dedicated uploadPhoto method
      await awsVideoUploadService.uploadVideo(
        user.userId,
        {
          title: `Profile Photo ${new Date().toLocaleDateString()}`,
          description: 'User profile photo',
          userId: user.userId,
          tags: ['profile', 'photo'],
        },
        file,
        (status, progress) => {
          setUploadStatus(status);
          if (progress) {
            setUploadProgress(progress.percentage);
          }
        },
        folderPath
      );

      setUploadStatus('Photo uploaded successfully!');
      Alert.alert('Success', 'Photo uploaded successfully!');
      setShowUpload(false);
      
      // Reload profile media
      setTimeout(() => {
        loadUserProfileMedia();
      }, 1000);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      setUploadError(errorMessage);
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleUploadVideo = async () => {
    try {
      setUploadError('');
      const file = await awsVideoUploadService.pickVideoFile();
      if (!file) {
        setUploadError('No file selected');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Uploading video...');

      const folderPath = `profile/${user.userId}/videos`;
      await awsVideoUploadService.uploadVideo(
        user.userId,
        {
          title: `Profile Video ${new Date().toLocaleDateString()}`,
          description: 'User profile video',
          userId: user.userId,
          tags: ['profile', 'video'],
        },
        file,
        (status, progress) => {
          setUploadStatus(status);
          if (progress) {
            setUploadProgress(progress.percentage);
          }
        },
        folderPath
      );

      setUploadStatus('Video uploaded successfully!');
      Alert.alert('Success', 'Video uploaded successfully!');
      setShowUpload(false);
      
      // Reload profile media
      setTimeout(() => {
        loadUserProfileMedia();
      }, 1000);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
      setUploadError(errorMessage);
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const userLevel = 2;
  const userXP = 100;

  const myProfile: CreatorProfile = {
    id: user.userId,
    username: user.username || user.email?.split('@')[0] || "user",
    fullName: user.name,
    bio: user.bio || "\u{1F680} Learning AI | Building the future",
    followers: userStats?.followersCount || 0,
    following: userStats?.followingCount || 0,
    impressions: userStats?.totalViews || 0,
    problemsCreated: userStats?.totalSubmissions || 0,
    problemsSolved: userStats?.correctSubmissions || 0,
    posts: [],
  };

  const currentProfile = selectedProfile || myProfile;
  const isOwnProfile = !selectedProfile;

  const filteredProfiles = searchResults.filter(
    (p) =>
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const response = await userService.searchUsers(query, 0, 10);
        if (response.success && response.data?.content) {
          setSearchResults(response.data.content.map((u: any) => ({
            id: u.userId,
            username: u.username || u.name,
            fullName: u.name,
            bio: u.bio || '',
            followers: 0,
            following: 0,
            impressions: 0,
            problemsCreated: 0,
            problemsSolved: 0,
            posts: [],
          })));
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  };

  const handleBuyTokens = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setLoading(true);
    
    try {
      const response = await paymentService.createPayment({
        userId: user.userId,
        amount: pkg.price,
        currency: 'INR',
        packageId: `pkg_${pkg.tokens}`,
        paymentMethod: 'razorpay',
      });

      if (response.success) {
        Alert.alert(
          "Purchase Initiated!",
          `Payment order created for ${pkg.tokens} tokens. Complete payment to receive your tokens.`,
          [{ text: "OK", onPress: () => setShowAddTokens(false) }]
        );
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.postItem, { backgroundColor: item.thumbnail }]}>
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Ionicons name="heart" size={16} color="white" />
            <Text style={styles.postStatText}>{formatCount(item.likes)}</Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble" size={16} color="white" />
            <Text style={styles.postStatText}>{item.comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: item.type === 'credit' ? COLORS.primary + '20' : '#EF4444' + '20' }
      ]}>
        <Ionicons 
          name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
          size={20} 
          color={item.type === 'credit' ? COLORS.primary : '#EF4444'} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'credit' ? COLORS.primary : '#EF4444' }
      ]}>
        {item.type === 'credit' ? '+' : '-'}{item.amount}
      </Text>
    </View>
  );

  const renderTokenPackage = ({ item }: { item: TokenPackage }) => (
    <TouchableOpacity
      style={[styles.tokenPackage, item.popular && styles.popularPackage]}
      onPress={() => handleBuyTokens(item)}
      disabled={loading}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Popular</Text>
        </View>
      )}
      <View style={styles.packageContent}>
        <View style={styles.packageLeft}>
          <View style={styles.packageIcon}>
            <Ionicons name="diamond" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.packageTokens}>{item.tokens.toLocaleString()} Tokens</Text>
            {item.bonus > 0 && (
              <Text style={styles.packageBonus}>+{item.bonus} bonus tokens</Text>
            )}
          </View>
        </View>
        <View style={styles.packageRight}>
          <Text style={styles.packagePrice}>â‚¹{item.price}</Text>
          <Text style={styles.packageRate}>â‚¹{(item.price / item.tokens).toFixed(2)}/token</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 90, overflow: 'hidden' }]}>
      {/* Background radial glows */}
      <View style={{ position: 'absolute', top: -100, left: -50, width: 300, height: 300, backgroundColor: 'rgba(8, 224, 162, 0.08)', borderRadius: 150, transform: [{ scaleX: 1.5 }] }} />
      <View style={{ position: 'absolute', bottom: 100, right: -100, width: 400, height: 400, backgroundColor: 'rgba(45, 156, 219, 0.05)', borderRadius: 200 }} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {selectedProfile ? (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setSelectedProfile(null)}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.foreground} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.username}>@{currentProfile.username}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {isOwnProfile && (
            <View style={styles.tokensBadge}>
              <Ionicons name="gem" size={12} color="#FFD700" />
              <Text style={styles.tokensText}>{userTokens}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowSearch(true)}>
            <Ionicons name="search" size={20} color={COLORS.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowUpload(true)}>
            <Ionicons name="add" size={20} color={COLORS.mutedForeground} />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity style={styles.headerButton} onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to log out?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Logout", style: "destructive", onPress: onLogout }
                ]
              );
            }}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          {isOwnProfile && (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="settings" size={20} color={COLORS.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {user.profilePictureUrl ? (
                <Image
                  source={{ uri: user.profilePictureUrl }}
                  style={styles.avatarGradient}
                />
              ) : (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.gradientMiddle]}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>{currentProfile.fullName[0]}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{currentProfile.fullName}</Text>
              {user.email ? (
                <Text style={[styles.bio, { fontSize: 12, marginBottom: 4, color: COLORS.mutedForeground }]}>{user.email}</Text>
              ) : null}
              <Text style={styles.bio}>{currentProfile.bio}</Text>
              
              {!isOwnProfile && (
                <View style={styles.profileActions}>
                  <TouchableOpacity style={styles.followButton}>
                    <Ionicons name="person-add" size={16} color={COLORS.primaryForeground} />
                    <Text style={styles.followButtonText}>Follow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageButton}>
                    <Text style={styles.messageButtonText}>Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatCount(currentProfile.followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatCount(currentProfile.impressions)}</Text>
              <Text style={styles.statLabel}>Impressions</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>Lv.{userLevel}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{userXP}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>
        </View>

        {/* Premium Tabs */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0B0B0B', paddingHorizontal: 16 }}>
          {['posts', 'saved', ...(isOwnProfile ? ['wallet'] : [])].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)} style={{ paddingVertical: 16, marginRight: 24, position: 'relative' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={tab === 'posts' ? 'grid' : tab === 'saved' ? 'bookmark' : 'wallet'} size={16} color={activeTab === tab ? '#fff' : '#64748B'} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: activeTab === tab ? '#fff' : '#64748B', textTransform: 'capitalize' }}>{tab}</Text>
              </View>
              {activeTab === tab && (
                <View style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: '#00D084', borderRadius: 2, shadowColor: '#00D084', shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.5, shadowRadius: 5 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <ScrollView style={styles.postsGrid}>
            {/* Profile Media Grid */}
            {allMedia && allMedia.length > 0 ? (
              <View>
                <Text style={[styles.sectionTitle, { paddingHorizontal: SPACING.md, paddingTop: SPACING.md }]}>
                  My Media
                </Text>
                <MediaGrid
                  media={allMedia.map((item, index) => ({
                    ...item,
                    id: item.id || `${item.mediaUrl}-${index}`,
                  }))}
                  onMediaPress={handleMediaPress}
                  loading={false}
                  numColumns={3}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={COLORS.mutedForeground} />
                <Text style={styles.emptyStateText}>No photos or videos yet</Text>
                <Text style={[styles.emptyStateText, { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.mutedForeground }]}>
                  Tap the + button above to upload your first media
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {activeTab === 'saved' && (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={COLORS.mutedForeground} />
            <Text style={styles.emptyStateText}>No saved posts</Text>
          </View>
        )}

        {activeTab === 'wallet' && (
          <View style={styles.walletContent}>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={[COLORS.glassBg, COLORS.card]}
                style={styles.balanceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.balanceHeader}>
                  <View style={styles.balanceInfo}>
                    <View style={styles.balanceIcon}>
                      <Ionicons name="gem" size={24} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.balanceLabel}>Token Balance</Text>
                      <Text style={styles.balanceAmount}>{userTokens}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.addButton} onPress={() => setShowAddTokens(true)}>
                    <Ionicons name="add" size={16} color={COLORS.primaryForeground} />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.quickStat}>
                    <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                    <Text style={styles.quickStatValue}>+250</Text>
                    <Text style={styles.quickStatLabel}>This week</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Ionicons name="arrow-up" size={16} color="#EF4444" />
                    <Text style={styles.quickStatValue}>-150</Text>
                    <Text style={styles.quickStatLabel}>Spent</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Ionicons name="gift" size={16} color={COLORS.primary} />
                    <Text style={styles.quickStatValue}>+100</Text>
                    <Text style={styles.quickStatLabel}>Rewards</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Transaction History */}
            <View style={styles.transactionsSection}>
              <View style={styles.transactionsHeader}>
                <View style={styles.transactionsTitleContainer}>
                  <Ionicons name="time" size={16} color={COLORS.primary} />
                  <Text style={styles.transactionsTitle}>Recent Transactions</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Creators</Text>
            <TouchableOpacity
              onPress={() => setShowSearch(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={16} color={COLORS.mutedForeground} style={styles.searchInputIcon} />
              <TextInput
                placeholder="Search by username or name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>
            <ScrollView style={styles.searchResults}>
              {filteredProfiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setSelectedProfile(p);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  style={styles.searchResultItem}
                >
                  <View style={styles.searchResultAvatar}>
                    <Text style={styles.searchResultAvatarText}>{p.fullName[0]}</Text>
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultUsername}>@{p.username}</Text>
                    <Text style={styles.searchResultName}>{p.fullName}</Text>
                    <View style={styles.searchResultStats}>
                      <Text style={styles.searchResultStat}>{formatCount(p.followers)} followers</Text>
                      <Text style={styles.searchResultStat}>â€¢</Text>
                      <Text style={[styles.searchResultStat, { color: COLORS.primary }]}>{p.problemsCreated} created</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.searchResultFollowButton}>
                    <Ionicons name="person-add" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Tokens Modal */}
      <Modal
        visible={showAddTokens}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTokens(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="gem" size={20} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Add Tokens</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddTokens(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose a token package to unlock AI tools and features.
            </Text>

            <FlatList
              data={tokenPackages}
              renderItem={renderTokenPackage}
              keyExtractor={(item) => item.tokens.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />

            <View style={styles.paymentInfo}>
              <Ionicons name="card" size={16} color={COLORS.mutedForeground} />
              <Text style={styles.paymentInfoText}>Secure payment via Razorpay</Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing payment...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUpload}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpload(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Post</Text>
            <TouchableOpacity
              onPress={() => setShowUpload(false)}
              style={styles.modalCloseButton}
              disabled={isUploading}
            >
              <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
            </TouchableOpacity>
          </View>

          {isUploading && (
            <View style={{ padding: SPACING.md, backgroundColor: COLORS.glassBg }}>
              <Text style={styles.uploadStat}>{uploadStatus}</Text>
              <View style={{ marginVertical: SPACING.sm, backgroundColor: COLORS.border, height: 4, borderRadius: BORDER_RADIUS.xs, overflow: 'hidden' }}>
                <View style={{ width: `${uploadProgress}%`, backgroundColor: COLORS.primary, height: '100%' }} />
              </View>
              <Text style={[styles.uploadStat, { fontSize: TYPOGRAPHY.fontSizes.sm }]}>{uploadProgress}%</Text>
            </View>
          )}

          {uploadError && (
            <View style={{ padding: SPACING.md, backgroundColor: '#EF444450' }}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>{uploadError}</Text>
            </View>
          )}

          {!isUploading && (
            <View style={styles.uploadOptions}>
              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={handleUploadVideo}
                disabled={isUploading}
              >
                <View style={styles.uploadOptionIcon}>
                  <Ionicons name="videocam" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadOptionTitle}>Upload Reel</Text>
                <Text style={styles.uploadOptionSubtitle}>Video content</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={handleUploadPhoto}
                disabled={isUploading}
              >
                <View style={styles.uploadOptionIcon}>
                  <Ionicons name="image" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadOptionTitle}>Upload Photo</Text>
                <Text style={styles.uploadOptionSubtitle}>Image content</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={showVideoPlayer}
        items={allMedia}
        initialIndex={selectedMediaIndex}
        onClose={() => setShowVideoPlayer(false)}
        onIndexChange={handleMediaIndexChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0B0B0B',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  username: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tokensBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tokensText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
    color: '#fff',
  },
  headerButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.ring,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.primaryForeground,
  },
  profileInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  fullName: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  bio: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    lineHeight: 20,
  },
  profileActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    justifyContent: 'center',
  },
  followButtonText: {
    color: COLORS.primaryForeground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  messageButton: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    color: COLORS.foreground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.glassBg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  postsGrid: {
    padding: 2,
  },
  postItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    opacity: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  postStatText: {
    color: 'white',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.mutedForeground,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.md,
  },
  walletContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['4xl'],
  },
  balanceCard: {
    borderRadius: BORDER_RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  balanceGradient: {
    padding: SPACING.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.primaryForeground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  quickStatValue: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  quickStatLabel: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  transactionsSection: {
    marginBottom: SPACING.lg,
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  transactionsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  transactionsTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  searchInputContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  searchInputIcon: {
    position: 'absolute',
    left: SPACING.sm,
    top: '50%',
    transform: [{ translateY: -8 }],
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.foreground,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.xs,
  },
  searchResultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultAvatarText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.primaryForeground,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultUsername: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  searchResultName: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  searchResultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  searchResultStat: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  searchResultFollowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenPackage: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    position: 'relative',
  },
  popularPackage: {
    borderColor: COLORS.ring,
    backgroundColor: COLORS.glassBg,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  popularBadgeText: {
    color: COLORS.primaryForeground,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  packageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  packageIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageTokens: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  packageBonus: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  packageRate: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  paymentInfoText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.mutedForeground,
    marginTop: SPACING.sm,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  uploadOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  uploadOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  uploadOptionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  uploadOptionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  uploadStat: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  profileMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  profileMediaItem: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    zIndex: 1,
  },
  mediaItemTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#ffffff',
  },
});

export default ProfileScreen;


