import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { CoinPackage } from '../types';

interface CoinPackagesProps {
  onPackageSelect?: (packageData: CoinPackage) => void;
  selectedPackageId?: string;
}

export default function CoinPackages({
  onPackageSelect,
  selectedPackageId,
}: CoinPackagesProps) {
  const { user, isGuestUser } = useAuth();
  
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoinPackages();
  }, []);

  const loadCoinPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Demo data - in production, this would come from the backend
      const demoPackages: CoinPackage[] = [
        {
          id: 'starter',
          name: 'Starter Pack',
          coins: 100,
          price: 99,
          currency: 'INR',
          description: 'Perfect for trying out AI tools',
        },
        {
          id: 'popular',
          name: 'Popular Pack',
          coins: 500,
          price: 399,
          currency: 'INR',
          description: 'Most popular choice for regular users',
          popular: true,
        },
        {
          id: 'premium',
          name: 'Premium Pack',
          coins: 1000,
          price: 699,
          currency: 'INR',
          description: 'Best value for power users',
        },
        {
          id: 'enterprise',
          name: 'Enterprise Pack',
          coins: 2500,
          price: 1499,
          currency: 'INR',
          description: 'For businesses and heavy usage',
        },
        {
          id: 'unlimited',
          name: 'Unlimited Pack',
          coins: 10000,
          price: 4999,
          currency: 'INR',
          description: 'Maximum coins for unlimited creativity',
        },
      ];

      setPackages(demoPackages);
    } catch (error: any) {
      console.error('Error loading coin packages:', error);
      setError(error.message || 'Failed to load coin packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackagePress = (packageData: CoinPackage) => {
    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to purchase coin packages',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    onPackageSelect?.(packageData);
  };

  const calculateSavings = (packageData: CoinPackage) => {
    const baseRate = 1; // 1 INR per coin (base rate)
    const packageRate = packageData.price / packageData.coins;
    const savings = ((baseRate - packageRate) / baseRate) * 100;
    return Math.round(savings);
  };

  const getBestValuePackage = () => {
    return packages.reduce((best, current) => {
      const bestRate = best.price / best.coins;
      const currentRate = current.price / current.coins;
      return currentRate < bestRate ? current : best;
    }, packages[0]);
  };

  const renderPackageItem = ({ item }: { item: CoinPackage }) => {
    const isSelected = selectedPackageId === item.id;
    const savings = calculateSavings(item);
    const bestValue = getBestValuePackage();
    const isBestValue = bestValue && item.id === bestValue.id;

    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isSelected && styles.selectedPackage,
          item.popular && styles.popularPackage,
        ]}
        onPress={() => handlePackagePress(item)}
      >
        {/* Popular Badge */}
        {item.popular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={12} color="white" />
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}

        {/* Best Value Badge */}
        {isBestValue && !item.popular && (
          <View style={styles.bestValueBadge}>
            <Ionicons name="trophy" size={12} color="white" />
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>
        )}

        {/* Package Content */}
        <View style={styles.packageContent}>
          {/* Header */}
          <View style={styles.packageHeader}>
            <Text style={styles.packageName}>{item.name}</Text>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
            )}
          </View>

          {/* Coins */}
          <View style={styles.coinsContainer}>
            <Ionicons name="diamond" size={32} color="#ffc107" />
            <Text style={styles.coinsAmount}>{item.coins.toLocaleString()}</Text>
            <Text style={styles.coinsLabel}>Coins</Text>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>â‚¹</Text>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.priceLabel}>/{item.coins} coins</Text>
          </View>

          {/* Savings */}
          {savings > 0 && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savingsText}>Save {savings}%</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.featureText}>No expiry</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.featureText}>Instant delivery</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.featureText}>Secure payment</Text>
            </View>
          </View>

          {/* Rate per coin */}
          <View style={styles.rateContainer}>
            <Text style={styles.rateText}>
              â‚¹{(item.price / item.coins).toFixed(2)} per coin
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <Ionicons name="diamond" size={24} color="#ffc107" />
        <Text style={styles.headerTitle}>Choose Your Coin Package</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Purchase coins to use AI tools, practice coding, and unlock premium features
      </Text>
      
      {/* Current Balance */}
      {!isGuestUser() && (
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance:</Text>
          <View style={styles.balanceAmount}>
            <Ionicons name="diamond" size={16} color="#ffc107" />
            <Text style={styles.balanceText}>150 coins</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="diamond" size={64} color="#1A1A1A" />
      <Text style={styles.emptyTitle}>No Packages Available</Text>
      <Text style={styles.emptyText}>
        Coin packages are currently unavailable. Please try again later.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading coin packages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCoinPackages}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={packages.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
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
  contentContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#1976d2',
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginLeft: 4,
  },
  packageCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPackage: {
    borderWidth: 2,
    borderColor: '#28a745',
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: '#00D084',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#00D084',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0B0B0B',
    marginLeft: 4,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0B0B0B',
    marginLeft: 4,
  },
  packageContent: {
    padding: 16,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  coinsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  coinsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginTop: 8,
  },
  coinsLabel: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  priceLabel: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 4,
  },
  savingsContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28a745',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 8,
  },
  rateContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  rateText: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
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

