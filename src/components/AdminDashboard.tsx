import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { adminService } from '../services/adminService';

interface AdminStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalVideos: number;
    pendingVideos: number;
    totalAITools: number;
    pendingAITools: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  userStats: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    guestUsers: number;
    registeredUsers: number;
    premiumUsers: number;
  };
  contentStats: {
    videosUploadedToday: number;
    videosUploadedThisWeek: number;
    aiToolsCreatedToday: number;
    aiToolsCreatedThisWeek: number;
    flaggedContent: number;
    reportedContent: number;
  };
  revenueStats: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    topSellingPackage: string;
    averageOrderValue: number;
    conversionRate: number;
  };
}

interface PendingItem {
  id: string;
  type: 'video' | 'ai-tool';
  title: string;
  creator: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  flagReason?: string;
}

interface AdminDashboardProps {
  onNavigateToSection?: (section: string, data?: any) => void;
}

export default function AdminDashboard({
  onNavigateToSection,
}: AdminDashboardProps) {
  const { user, isGuestUser } = useAuth();
  
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'content' | 'revenue'>('overview');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, []);

  const loadAdminData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch admin dashboard data from the backend
      const [dashboardResponse, pendingVideosResponse, pendingAIToolsResponse] = await Promise.all([
        adminService.getDashboard(),
        adminService.getPendingVideos(0, 10),
        adminService.getPendingAITools(0, 10),
      ]);

      if (dashboardResponse.success && dashboardResponse.data) {
        setAdminStats(dashboardResponse.data as unknown as AdminStats);
      }

      // Combine pending videos and AI tools into a single list
      const combinedPendingItems: PendingItem[] = [];

      if (pendingVideosResponse.success && pendingVideosResponse.data?.content) {
        pendingVideosResponse.data.content.forEach((video: any) => {
          combinedPendingItems.push({
            id: video.videoId || video.id,
            type: 'video',
            title: video.title || 'Untitled Video',
            creator: video.authorName || video.authorId || 'Unknown',
            createdAt: video.createdAt || new Date().toISOString(),
            status: 'PENDING',
            flagReason: video.flagReason,
          });
        });
      }

      if (pendingAIToolsResponse.success && pendingAIToolsResponse.data?.content) {
        pendingAIToolsResponse.data.content.forEach((tool: any) => {
          combinedPendingItems.push({
            id: tool.id || tool.toolId,
            type: 'ai-tool',
            title: tool.name || tool.title || 'Untitled Tool',
            creator: tool.creatorName || tool.creatorId || 'Unknown',
            createdAt: tool.createdAt || new Date().toISOString(),
            status: 'PENDING',
          });
        });
      }

      setPendingItems(combinedPendingItems);

    } catch (error: any) {
      console.error('Error loading admin data:', error);
      setError(error.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAdminData(false);
  };

  const handleApproveItem = async (itemId: string, type: 'video' | 'ai-tool') => {
    try {
      if (type === 'video') {
        await adminService.reviewVideo(itemId, { action: 'APPROVE', reason: 'Approved by admin' } as any);
      } else {
        await adminService.approveAITool(itemId, 'Approved by admin');
      }
      
      setPendingItems(prev => prev.filter(item => item.id !== itemId));
      Alert.alert('Success', `${type === 'video' ? 'Video' : 'AI Tool'} approved successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve item');
    }
  };

  const handleRejectItem = async (itemId: string, type: 'video' | 'ai-tool') => {
    Alert.alert(
      'Reject Item',
      `Are you sure you want to reject this ${type === 'video' ? 'video' : 'AI tool'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'video') {
                await adminService.reviewVideo(itemId, { action: 'REJECT', reason: 'Rejected by admin' } as any);
              } else {
                await adminService.rejectAITool(itemId, 'Rejected by admin');
              }
              
              setPendingItems(prev => prev.filter(item => item.id !== itemId));
              Alert.alert('Success', `${type === 'video' ? 'Video' : 'AI Tool'} rejected`);
            } catch (error) {
              Alert.alert('Error', 'Failed to reject item');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderOverviewTab = () => {
    if (!adminStats) return null;

    const { overview } = adminStats;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name="people" size={32} color="#00D084" />
            <Text style={styles.overviewValue}>{overview.totalUsers.toLocaleString()}</Text>
            <Text style={styles.overviewLabel}>Total Users</Text>
            <Text style={styles.overviewSubtext}>{overview.activeUsers.toLocaleString()} active</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Ionicons name="play-circle" size={32} color="#00D084" />
            <Text style={styles.overviewValue}>{overview.totalVideos.toLocaleString()}</Text>
            <Text style={styles.overviewLabel}>Total Videos</Text>
            <Text style={styles.overviewSubtext}>{overview.pendingVideos} pending</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Ionicons name="bulb" size={32} color="#ffc107" />
            <Text style={styles.overviewValue}>{overview.totalAITools}</Text>
            <Text style={styles.overviewLabel}>AI Tools</Text>
            <Text style={styles.overviewSubtext}>{overview.pendingAITools} pending</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Ionicons name="diamond" size={32} color="#dc3545" />
            <Text style={styles.overviewValue}>{formatCurrency(overview.totalRevenue)}</Text>
            <Text style={styles.overviewLabel}>Total Revenue</Text>
            <Text style={styles.overviewSubtext}>{formatCurrency(overview.monthlyRevenue)} this month</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => onNavigateToSection?.('users')}
            >
              <Ionicons name="people" size={24} color="#00D084" />
              <Text style={styles.quickActionText}>Manage Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => onNavigateToSection?.('content')}
            >
              <Ionicons name="document-text" size={24} color="#00D084" />
              <Text style={styles.quickActionText}>Review Content</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => onNavigateToSection?.('analytics')}
            >
              <Ionicons name="analytics" size={24} color="#ffc107" />
              <Text style={styles.quickActionText}>View Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => onNavigateToSection?.('settings')}
            >
              <Ionicons name="settings" size={24} color="#555555" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Items */}
        <View style={styles.pendingItemsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            <TouchableOpacity onPress={() => onNavigateToSection?.('pending')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {pendingItems.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.pendingItem}>
              <View style={styles.pendingItemContent}>
                <View style={styles.pendingItemHeader}>
                  <Ionicons 
                    name={item.type === 'video' ? 'play-circle' : 'bulb'} 
                    size={20} 
                    color={item.type === 'video' ? '#00D084' : '#ffc107'} 
                  />
                  <Text style={styles.pendingItemTitle} numberOfLines={1}>{item.title}</Text>
                </View>
                <Text style={styles.pendingItemCreator}>by {item.creator}</Text>
                <Text style={styles.pendingItemTime}>{formatDate(item.createdAt)}</Text>
                {item.flagReason && (
                  <Text style={styles.flagReason}>âš ï¸ {item.flagReason}</Text>
                )}
              </View>
              
              <View style={styles.pendingItemActions}>
                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => handleApproveItem(item.id, item.type)}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleRejectItem(item.id, item.type)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderUsersTab = () => {
    if (!adminStats) return null;

    const { userStats } = adminStats;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats.newUsersToday}</Text>
            <Text style={styles.statLabel}>New Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats.newUsersThisWeek}</Text>
            <Text style={styles.statLabel}>New This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats.newUsersThisMonth.toLocaleString()}</Text>
            <Text style={styles.statLabel}>New This Month</Text>
          </View>
        </View>

        <View style={styles.userDistributionCard}>
          <Text style={styles.sectionTitle}>User Distribution</Text>
          <View style={styles.distributionItem}>
            <View style={styles.distributionInfo}>
              <Text style={styles.distributionLabel}>Guest Users</Text>
              <Text style={styles.distributionValue}>{userStats.guestUsers.toLocaleString()}</Text>
            </View>
            <View style={styles.distributionBar}>
              <View style={[styles.distributionFill, { width: '30%', backgroundColor: '#555555' }]} />
            </View>
          </View>
          
          <View style={styles.distributionItem}>
            <View style={styles.distributionInfo}>
              <Text style={styles.distributionLabel}>Registered Users</Text>
              <Text style={styles.distributionValue}>{userStats.registeredUsers.toLocaleString()}</Text>
            </View>
            <View style={styles.distributionBar}>
              <View style={[styles.distributionFill, { width: '60%', backgroundColor: '#00D084' }]} />
            </View>
          </View>
          
          <View style={styles.distributionItem}>
            <View style={styles.distributionInfo}>
              <Text style={styles.distributionLabel}>Premium Users</Text>
              <Text style={styles.distributionValue}>{userStats.premiumUsers.toLocaleString()}</Text>
            </View>
            <View style={styles.distributionBar}>
              <View style={[styles.distributionFill, { width: '45%', backgroundColor: '#00D084' }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderContentTab = () => {
    if (!adminStats) return null;

    const { contentStats } = adminStats;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contentStats.videosUploadedToday}</Text>
            <Text style={styles.statLabel}>Videos Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contentStats.videosUploadedThisWeek}</Text>
            <Text style={styles.statLabel}>Videos This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contentStats.aiToolsCreatedToday}</Text>
            <Text style={styles.statLabel}>AI Tools Today</Text>
          </View>
        </View>

        <View style={styles.contentModerationCard}>
          <Text style={styles.sectionTitle}>Content Moderation</Text>
          
          <TouchableOpacity style={styles.moderationItem}>
            <View style={styles.moderationInfo}>
              <Ionicons name="flag" size={20} color="#dc3545" />
              <Text style={styles.moderationLabel}>Flagged Content</Text>
            </View>
            <View style={styles.moderationBadge}>
              <Text style={styles.moderationBadgeText}>{contentStats.flaggedContent}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moderationItem}>
            <View style={styles.moderationInfo}>
              <Ionicons name="alert-circle" size={20} color="#ffc107" />
              <Text style={styles.moderationLabel}>Reported Content</Text>
            </View>
            <View style={styles.moderationBadge}>
              <Text style={styles.moderationBadgeText}>{contentStats.reportedContent}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderRevenueTab = () => {
    if (!adminStats) return null;

    const { revenueStats } = adminStats;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.revenueGrid}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueValue}>{formatCurrency(revenueStats.todayRevenue)}</Text>
            <Text style={styles.revenueLabel}>Today</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueValue}>{formatCurrency(revenueStats.weekRevenue)}</Text>
            <Text style={styles.revenueLabel}>This Week</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueValue}>{formatCurrency(revenueStats.monthRevenue)}</Text>
            <Text style={styles.revenueLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.revenueInsightsCard}>
          <Text style={styles.sectionTitle}>Revenue Insights</Text>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Top Selling Package</Text>
            <Text style={styles.insightValue}>{revenueStats.topSellingPackage}</Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Average Order Value</Text>
            <Text style={styles.insightValue}>{formatCurrency(revenueStats.averageOrderValue)}</Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Conversion Rate</Text>
            <Text style={styles.insightValue}>{revenueStats.conversionRate}%</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      {[
        { key: 'overview', label: 'Overview', icon: 'grid' },
        { key: 'users', label: 'Users', icon: 'people' },
        { key: 'content', label: 'Content', icon: 'document-text' },
        { key: 'revenue', label: 'Revenue', icon: 'diamond' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={16} 
            color={selectedTab === tab.key ? '#00D084' : '#555555'} 
          />
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === tab.key && styles.tabButtonTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'content':
        return renderContentTab();
      case 'revenue':
        return renderRevenueTab();
      default:
        return renderOverviewTab();
    }
  };

  if (isGuestUser() || user?.role !== 'ADMIN') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="shield-checkmark" size={64} color="#1A1A1A" />
        <Text style={styles.unauthorizedTitle}>Admin Access Required</Text>
        <Text style={styles.unauthorizedText}>
          You need administrator privileges to access this dashboard
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAdminData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your platform and monitor performance</Text>
      </View>

      {renderTabSelector()}
      
      <ScrollView 
        style={styles.content}
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
        {renderTabContent()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#161616',
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
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
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#111111',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#00D084',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 10,
    color: '#555555',
    textAlign: 'center',
  },
  quickActionsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#E8F5E8',
    marginTop: 8,
    textAlign: 'center',
  },
  pendingItemsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00D084',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  pendingItemContent: {
    flex: 1,
  },
  pendingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8F5E8',
    marginLeft: 8,
    flex: 1,
  },
  pendingItemCreator: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 2,
  },
  pendingItemTime: {
    fontSize: 12,
    color: '#555555',
  },
  flagReason: {
    fontSize: 11,
    color: '#dc3545',
    marginTop: 4,
  },
  pendingItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#00D084',
    padding: 8,
    borderRadius: 6,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  userDistributionCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  distributionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  distributionBar: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
  },
  distributionFill: {
    height: '100%',
    borderRadius: 3,
  },
  contentModerationCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moderationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  moderationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moderationLabel: {
    fontSize: 14,
    color: '#E8F5E8',
    marginLeft: 8,
  },
  moderationBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moderationBadgeText: {
    fontSize: 12,
    color: '#E8F5E8',
    fontWeight: '600',
  },
  revenueGrid: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 4,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
  },
  revenueInsightsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  insightLabel: {
    fontSize: 14,
    color: '#555555',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  bottomSpacing: {
    height: 40,
  },
});


