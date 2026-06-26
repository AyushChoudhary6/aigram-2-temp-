import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsData {
  overview: {
    totalVideosWatched: number;
    totalAIToolsUsed: number;
    totalPracticeQuestions: number;
    totalCoinsSpent: number;
    totalCoinsEarned: number;
    streakDays: number;
  };
  videoStats: {
    watchTime: number; // in minutes
    favoriteGenre: string;
    completionRate: number; // percentage
    recentVideos: Array<{
      id: string;
      title: string;
      watchedAt: string;
      duration: number;
      watchedDuration: number;
    }>;
  };
  aiToolsStats: {
    mostUsedTool: string;
    totalExecutions: number;
    successRate: number;
    favoriteCategory: string;
    recentUsage: Array<{
      toolId: string;
      toolName: string;
      usedAt: string;
      coinsSpent: number;
      success: boolean;
    }>;
  };
  practiceStats: {
    questionsAttempted: number;
    questionsCorrect: number;
    accuracyRate: number;
    favoriteLanguage: string;
    currentRank: number;
    totalRank: number;
    recentSubmissions: Array<{
      questionId: string;
      questionTitle: string;
      submittedAt: string;
      status: 'CORRECT' | 'INCORRECT' | 'PARTIAL';
      language: string;
    }>;
  };
  engagementStats: {
    dailyActivity: Array<{
      date: string;
      videosWatched: number;
      aiToolsUsed: number;
      questionsAttempted: number;
    }>;
    weeklyProgress: Array<{
      week: string;
      totalActivity: number;
      coinsSpent: number;
    }>;
  };
}

interface UserAnalyticsDashboardProps {
  onNavigateToSection?: (section: string) => void;
}

export default function UserAnalyticsDashboard({
  onNavigateToSection,
}: UserAnalyticsDashboardProps) {
  const { user, isGuestUser } = useAuth();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!isGuestUser()) {
      loadAnalyticsData();
    }
  }, [selectedTimeframe]);

  const loadAnalyticsData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch user analytics from the backend
      const response = await analyticsService.getUserAnalytics();

      if (response.success && response.data) {
        setAnalyticsData(response.data as unknown as AnalyticsData);
      }

    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalyticsData(false);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'CORRECT':
        return '#28a745';
      case 'PARTIAL':
        return '#ffc107';
      case 'INCORRECT':
        return '#dc3545';
      default:
        return '#555555';
    }
  };

  const renderOverviewCard = () => {
    if (!analyticsData) return null;

    const { overview } = analyticsData;

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Ionicons name="play-circle" size={24} color="#00D084" />
            <Text style={styles.overviewValue}>{overview.totalVideosWatched}</Text>
            <Text style={styles.overviewLabel}>Videos Watched</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="bulb" size={24} color="#28a745" />
            <Text style={styles.overviewValue}>{overview.totalAIToolsUsed}</Text>
            <Text style={styles.overviewLabel}>AI Tools Used</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="code" size={24} color="#ffc107" />
            <Text style={styles.overviewValue}>{overview.totalPracticeQuestions}</Text>
            <Text style={styles.overviewLabel}>Questions Solved</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="flame" size={24} color="#dc3545" />
            <Text style={styles.overviewValue}>{overview.streakDays}</Text>
            <Text style={styles.overviewLabel}>Day Streak</Text>
          </View>
        </View>
        
        <View style={styles.coinsOverview}>
          <View style={styles.coinsStat}>
            <Ionicons name="gem" size={20} color="#ffc107" />
            <Text style={styles.coinsValue}>+{overview.totalCoinsEarned}</Text>
            <Text style={styles.coinsLabel}>Earned</Text>
          </View>
          <View style={styles.coinsStat}>
            <Ionicons name="diamond" size={20} color="#dc3545" />
            <Text style={styles.coinsValue}>-{overview.totalCoinsSpent}</Text>
            <Text style={styles.coinsLabel}>Spent</Text>
          </View>
          <View style={styles.coinsStat}>
            <Ionicons name="diamond" size={20} color="#28a745" />
            <Text style={styles.coinsValue}>+{overview.totalCoinsEarned - overview.totalCoinsSpent}</Text>
            <Text style={styles.coinsLabel}>Net</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderVideoStats = () => {
    if (!analyticsData) return null;

    const { videoStats } = analyticsData;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Video Analytics</Text>
          <TouchableOpacity onPress={() => onNavigateToSection?.('videos')}>
            <Ionicons name="chevron-forward" size={20} color="#00D084" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(videoStats.watchTime)}</Text>
            <Text style={styles.statLabel}>Watch Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{videoStats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{videoStats.favoriteGenre}</Text>
            <Text style={styles.statLabel}>Favorite Genre</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Recent Videos</Text>
        {videoStats.recentVideos.slice(0, 3).map((video, index) => (
          <View key={video.id} style={styles.recentItem}>
            <View style={styles.recentItemContent}>
              <Text style={styles.recentItemTitle} numberOfLines={1}>{video.title}</Text>
              <Text style={styles.recentItemTime}>{formatDate(video.watchedAt)}</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(video.watchedDuration / video.duration) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((video.watchedDuration / video.duration) * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAIToolsStats = () => {
    if (!analyticsData) return null;

    const { aiToolsStats } = analyticsData;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>AI Tools Analytics</Text>
          <TouchableOpacity onPress={() => onNavigateToSection?.('ai-tools')}>
            <Ionicons name="chevron-forward" size={20} color="#00D084" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{aiToolsStats.totalExecutions}</Text>
            <Text style={styles.statLabel}>Total Uses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{aiToolsStats.successRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{aiToolsStats.mostUsedTool}</Text>
            <Text style={styles.statLabel}>Most Used</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Recent Usage</Text>
        {aiToolsStats.recentUsage.slice(0, 3).map((usage, index) => (
          <View key={`${usage.toolId}-${index}`} style={styles.recentItem}>
            <View style={styles.recentItemContent}>
              <Text style={styles.recentItemTitle} numberOfLines={1}>{usage.toolName}</Text>
              <Text style={styles.recentItemTime}>{formatDate(usage.usedAt)}</Text>
            </View>
            <View style={styles.recentItemRight}>
              <View style={styles.coinsSpent}>
                <Ionicons name="diamond" size={12} color="#ffc107" />
                <Text style={styles.coinsSpentText}>{usage.coinsSpent}</Text>
              </View>
              <Ionicons 
                name={usage.success ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={usage.success ? "#28a745" : "#dc3545"} 
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPracticeStats = () => {
    if (!analyticsData) return null;

    const { practiceStats } = analyticsData;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Practice Analytics</Text>
          <TouchableOpacity onPress={() => onNavigateToSection?.('practice')}>
            <Ionicons name="chevron-forward" size={20} color="#00D084" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{practiceStats.questionsAttempted}</Text>
            <Text style={styles.statLabel}>Attempted</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{practiceStats.accuracyRate}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{practiceStats.currentRank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        <View style={styles.rankProgress}>
          <Text style={styles.rankText}>
            Rank {practiceStats.currentRank} of {practiceStats.totalRank.toLocaleString()}
          </Text>
          <View style={styles.rankBar}>
            <View 
              style={[
                styles.rankFill, 
                { width: `${((practiceStats.totalRank - practiceStats.currentRank) / practiceStats.totalRank) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Recent Submissions</Text>
        {practiceStats.recentSubmissions.slice(0, 3).map((submission, index) => (
          <View key={`${submission.questionId}-${index}`} style={styles.recentItem}>
            <View style={styles.recentItemContent}>
              <Text style={styles.recentItemTitle} numberOfLines={1}>{submission.questionTitle}</Text>
              <Text style={styles.recentItemTime}>{formatDate(submission.submittedAt)}</Text>
            </View>
            <View style={styles.recentItemRight}>
              <Text style={styles.languageTag}>{submission.language}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
                <Text style={styles.statusText}>{submission.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelector}>
      {(['7d', '30d', '90d'] as const).map((timeframe) => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive,
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
        >
          <Text
            style={[
              styles.timeframeButtonText,
              selectedTimeframe === timeframe && styles.timeframeButtonTextActive,
            ]}
          >
            {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : '90 Days'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isGuestUser()) {
    return (
      <View style={styles.guestContainer}>
        <Ionicons name="analytics" size={64} color="#1A1A1A" />
        <Text style={styles.guestTitle}>Analytics Access Required</Text>
        <Text style={styles.guestText}>
          Please register or login to view your learning analytics and progress tracking
        </Text>
        <TouchableOpacity style={styles.guestButton}>
          <Text style={styles.guestButtonText}>Login / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAnalyticsData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#00D084']}
          tintColor="#00D084"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your learning progress and achievements</Text>
      </View>

      {renderTimeframeSelector()}
      {renderOverviewCard()}
      {renderVideoStats()}
      {renderAIToolsStats()}
      {renderPracticeStats()}

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    color: '#555555',
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
    color: '#555555',
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
    color: '#E8F5E8',
    fontSize: 14,
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#161616',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 16,
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  guestButton: {
    backgroundColor: '#00D084',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  guestButtonText: {
    color: '#E8F5E8',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#E8F5E8',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#555555',
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#00D084',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: '#E8F5E8',
    fontWeight: '600',
  },
  overviewCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  overviewItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
  },
  coinsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  coinsStat: {
    alignItems: 'center',
  },
  coinsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 4,
    marginBottom: 2,
  },
  coinsLabel: {
    fontSize: 10,
    color: '#555555',
  },
  statsCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8F5E8',
    marginBottom: 2,
  },
  recentItemTime: {
    fontSize: 12,
    color: '#555555',
  },
  recentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressBar: {
    width: 50,
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D084',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#555555',
  },
  coinsSpent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coinsSpentText: {
    fontSize: 10,
    color: '#856404',
    marginLeft: 2,
  },
  rankProgress: {
    marginBottom: 16,
  },
  rankText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 8,
    textAlign: 'center',
  },
  rankBar: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
  },
  rankFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  languageTag: {
    fontSize: 10,
    color: '#00D084',
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#E8F5E8',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

