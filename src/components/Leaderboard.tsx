import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  onUserPress?: (userId: string) => void;
  refreshInterval?: number;
}

const TIME_PERIODS = [
  { id: 'daily', name: 'Daily', icon: 'today' },
  { id: 'weekly', name: 'Weekly', icon: 'calendar' },
  { id: 'monthly', name: 'Monthly', icon: 'calendar-outline' },
  { id: 'all-time', name: 'All Time', icon: 'trophy' },
];

const CATEGORIES = [
  { id: 'overall', name: 'Overall' },
  { id: 'algorithms', name: 'Algorithms' },
  { id: 'data-structures', name: 'Data Structures' },
  { id: 'system-design', name: 'System Design' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
];

export default function Leaderboard({
  onUserPress,
  refreshInterval = 30000, // 30 seconds
}: LeaderboardProps) {
  const { user, isGuestUser } = useAuth();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadLeaderboard(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedPeriod, selectedCategory]);

  const loadLeaderboard = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // For now, use demo data until backend is ready
      const demoData: LeaderboardEntry[] = [
        {
          userId: '1',
          username: 'codemaster_pro',
          fullName: 'Alex Chen',
          score: 2850,
          questionsAnswered: 145,
          correctAnswers: 132,
          accuracy: 91,
          rank: 1,
          streak: 15,
        },
        {
          userId: '2',
          username: 'algorithm_ninja',
          userName: 'Sarah Kim',
          fullName: 'Sarah Kim',
          score: 2720,
          questionsAnswered: 138,
          correctAnswers: 125,
          totalSubmissions: 138,
          correctSubmissions: 125,
          accuracy: 91,
          rank: 2,
          streak: 12,
        },
        {
          userId: '3',
          username: 'data_wizard',
          userName: 'Mike Johnson',
          fullName: 'Mike Johnson',
          score: 2650,
          questionsAnswered: 142,
          correctAnswers: 120,
          totalSubmissions: 142,
          correctSubmissions: 120,
          accuracy: 85,
          rank: 3,
          streak: 8,
        },
        {
          userId: '4',
          username: 'python_guru',
          userName: 'Lisa Wang',
          fullName: 'Lisa Wang',
          score: 2580,
          questionsAnswered: 135,
          correctAnswers: 118,
          totalSubmissions: 135,
          correctSubmissions: 118,
          accuracy: 87,
          rank: 4,
          streak: 10,
        },
        {
          userId: '5',
          username: 'js_expert',
          userName: 'David Brown',
          fullName: 'David Brown',
          score: 2520,
          questionsAnswered: 128,
          correctAnswers: 112,
          totalSubmissions: 128,
          correctSubmissions: 112,
          accuracy: 88,
          rank: 5,
          streak: 6,
        },
        {
          userId: '6',
          username: 'react_dev',
          userName: 'Emma Davis',
          fullName: 'Emma Davis',
          score: 2480,
          questionsAnswered: 125,
          correctAnswers: 108,
          totalSubmissions: 125,
          correctSubmissions: 108,
          accuracy: 86,
          rank: 6,
          streak: 9,
        },
        {
          userId: '7',
          username: 'backend_boss',
          userName: 'Tom Wilson',
          fullName: 'Tom Wilson',
          score: 2420,
          questionsAnswered: 120,
          correctAnswers: 105,
          totalSubmissions: 120,
          correctSubmissions: 105,
          accuracy: 88,
          rank: 7,
          streak: 4,
        },
        {
          userId: '8',
          username: 'fullstack_hero',
          userName: 'Anna Martinez',
          fullName: 'Anna Martinez',
          score: 2380,
          questionsAnswered: 118,
          correctAnswers: 102,
          totalSubmissions: 118,
          correctSubmissions: 102,
          accuracy: 86,
          rank: 8,
          streak: 7,
        },
      ];

      setLeaderboard(demoData);

      // Set user's rank if they're logged in
      if (user && !isGuestUser()) {
        const currentUserRank: LeaderboardEntry = {
          userId: user.userId,
          username: user.username || 'You',
          userName: user.name,
          fullName: user.name,
          score: 1850,
          questionsAnswered: 85,
          correctAnswers: 72,
          totalSubmissions: 85,
          correctSubmissions: 72,
          accuracy: 85,
          rank: 15,
          streak: 3,
        };
        setUserRank(currentUserRank);
      }

    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      setError(error.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLeaderboard(false);
  };

  const handleUserPress = (entry: LeaderboardEntry) => {
    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to view user profiles'
      );
      return;
    }
    
    onUserPress?.(entry.userId);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { name: 'trophy', color: '#ffd700' };
      case 2: return { name: 'medal', color: '#c0c0c0' };
      case 3: return { name: 'medal', color: '#cd7f32' };
      default: return { name: 'person', color: '#888888' };
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return styles.firstPlace;
      case 2: return styles.secondPlace;
      case 3: return styles.thirdPlace;
      default: return styles.regularPlace;
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return '#dc3545';
    if (streak >= 5) return '#ffc107';
    return '#28a745';
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rankIcon = getRankIcon(item.rank);
    const isCurrentUser = user && item.userId === user.userId;

    return (
      <TouchableOpacity
        style={[
          styles.leaderboardItem,
          getRankStyle(item.rank),
          isCurrentUser && styles.currentUserItem
        ]}
        onPress={() => handleUserPress(item)}
      >
        {/* Rank */}
        <View style={styles.rankContainer}>
          <Ionicons
            name={rankIcon.name as any}
            size={24}
            color={rankIcon.color}
          />
          <Text style={[styles.rankText, { color: rankIcon.color }]}>
            #{item.rank}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.fullName || item.username)[0].toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
              {isCurrentUser ? 'You' : item.username}
            </Text>
            <Text style={styles.fullName}>{item.fullName}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.score.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{item.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          
          <View style={styles.statColumn}>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={12} color={getStreakColor(item.streak)} />
              <Text style={[styles.statValue, { color: getStreakColor(item.streak) }]}>
                {item.streak}
              </Text>
            </View>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={16} color="#555555" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Time Period Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Time Period</Text>
        <View style={styles.selectorButtons}>
          {TIME_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.selectorButton,
                selectedPeriod === period.id && styles.selectorButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Ionicons
                name={period.icon as any}
                size={14}
                color={selectedPeriod === period.id ? '#0B0B0B' : '#555555'}
              />
              <Text style={[
                styles.selectorButtonText,
                selectedPeriod === period.id && styles.selectorButtonTextActive
              ]}>
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Category</Text>
        <View style={styles.selectorButtons}>
          {CATEGORIES.slice(0, 3).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.selectorButton,
                selectedCategory === category.id && styles.selectorButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.selectorButtonText,
                selectedCategory === category.id && styles.selectorButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* User's Rank */}
      {userRank && !isGuestUser() && (
        <View style={styles.userRankContainer}>
          <Text style={styles.userRankTitle}>Your Rank</Text>
          <View style={styles.userRankCard}>
            <View style={styles.userRankInfo}>
              <Text style={styles.userRankPosition}>#{userRank.rank}</Text>
              <View>
                <Text style={styles.userRankScore}>{userRank.score.toLocaleString()} pts</Text>
                <Text style={styles.userRankAccuracy}>{userRank.accuracy}% accuracy</Text>
              </View>
            </View>
            <View style={styles.userRankStreak}>
              <Ionicons name="flame" size={16} color={getStreakColor(userRank.streak)} />
              <Text style={[styles.userRankStreakText, { color: getStreakColor(userRank.streak) }]}>
                {userRank.streak} day streak
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy" size={64} color="#1A1A1A" />
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptyText}>
        Be the first to solve questions and climb the leaderboard!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadLeaderboard()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.userId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#00D084']}
            tintColor="#00D084"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={leaderboard.length === 0 ? styles.emptyContentContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161616',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#161616',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#00D084',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0B0B0B',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContainer: {
    backgroundColor: '#0B0B0B',
    paddingBottom: 16,
    marginBottom: 8,
  },
  selectorContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 8,
  },
  selectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  selectorButtonActive: {
    backgroundColor: '#00D084',
    borderColor: '#00D084',
  },
  selectorButtonText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 4,
  },
  selectorButtonTextActive: {
    color: '#0B0B0B',
  },
  userRankContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  userRankTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 8,
  },
  userRankCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D084',
  },
  userRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRankPosition: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D084',
    marginRight: 12,
  },
  userRankScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  userRankAccuracy: {
    fontSize: 12,
    color: '#888888',
  },
  userRankStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRankStreakText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  firstPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffd700',
  },
  secondPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#c0c0c0',
  },
  thirdPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#cd7f32',
  },
  regularPlace: {
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  currentUserItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#00D084',
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D084',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0B0B',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#00D084',
  },
  fullName: {
    fontSize: 12,
    color: '#888888',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statColumn: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  statLabel: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

