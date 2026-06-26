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
import { Wallet as WalletType, WalletTransaction } from '../types';
import { userService } from '../services/userService';

interface WalletProps {
  onTopUp?: () => void;
  onTransactionPress?: (transaction: WalletTransaction) => void;
}

export default function Wallet({
  onTopUp,
  onTransactionPress,
}: WalletProps) {
  const { user, isGuestUser } = useAuth();
  
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGuestUser()) {
      loadWalletData();
    }
  }, []);

  const loadWalletData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch wallet data and transactions from the backend
      const [walletResponse, transactionsResponse] = await Promise.all([
        userService.getWallet(),
        userService.getWalletTransactions(0, 20),
      ]);

      if (walletResponse.success && walletResponse.data) {
        setWallet(walletResponse.data);
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.content || []);
      }

    } catch (error: any) {
      console.error('Error loading wallet data:', error);
      setError(error.message || 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWalletData(false);
  };

  const handleTopUp = () => {
    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to top up your wallet'
      );
      return;
    }
    
    onTopUp?.();
  };

  const handleTransactionPress = (transaction: WalletTransaction) => {
    onTransactionPress?.(transaction);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return { name: 'add-circle', color: '#28a745' };
      case 'DEBIT':
        return { name: 'remove-circle', color: '#dc3545' };
      default:
        return { name: 'swap-horizontal', color: '#888888' };
    }
  };

  const getTransactionAmount = (transaction: WalletTransaction) => {
    const sign = transaction.type === 'CREDIT' ? '+' : '-';
    return `${sign}${transaction.amount}`;
  };

  const formatDate = (dateString: string) => {
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
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const icon = getTransactionIcon(item.type);
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(item)}
      >
        <View style={styles.transactionIcon}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.transactionAmountText,
            { color: item.type === 'CREDIT' ? '#28a745' : '#dc3545' }
          ]}>
            {getTransactionAmount(item)}
          </Text>
          <Text style={styles.transactionCurrency}>coins</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceTitle}>
            <Ionicons name="gem" size={24} color="#ffc107" />
            <Text style={styles.balanceTitleText}>Coin Balance</Text>
          </View>
          <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.topUpButtonText}>Top Up</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.balanceAmount}>
          <Text style={styles.balanceValue}>{wallet?.balance.toLocaleString() || '0'}</Text>
          <Text style={styles.balanceCurrency}>coins</Text>
        </View>
        
        <Text style={styles.balanceSubtext}>
          Last updated: {wallet ? formatDate(wallet.lastUpdated) : 'Never'}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={20} color="#28a745" />
          <Text style={styles.statValue}>+{transactions.filter(t => t.type === 'CREDIT').length}</Text>
          <Text style={styles.statLabel}>Credits</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trending-down" size={20} color="#dc3545" />
          <Text style={styles.statValue}>{transactions.filter(t => t.type === 'DEBIT').length}</Text>
          <Text style={styles.statLabel}>Debits</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={20} color="#00D084" />
          <Text style={styles.statValue}>30</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
      </View>

      {/* Transactions Header */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#00D084" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="diamond" size={64} color="#1A1A1A" />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyText}>
        Your transaction history will appear here once you start using coins
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleTopUp}>
        <Text style={styles.emptyButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  if (isGuestUser()) {
    return (
      <View style={styles.guestContainer}>
        <Ionicons name="gem" size={64} color="#1A1A1A" />
        <Text style={styles.guestTitle}>Wallet Access Required</Text>
        <Text style={styles.guestText}>
          Please register or login to access your coin wallet and transaction history
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
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadWalletData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.transactionId}
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
        contentContainerStyle={transactions.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
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
    color: '#888888',
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
    color: '#0B0B0B',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8F5E8',
    marginLeft: 8,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D084',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  topUpButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B0B0B',
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  balanceCurrency: {
    fontSize: 16,
    color: '#888888',
    marginLeft: 8,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#888888',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#00D084',
    marginRight: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#888888',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionCurrency: {
    fontSize: 10,
    color: '#888888',
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#00D084',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#0B0B0B',
    fontSize: 16,
    fontWeight: '600',
  },
});

