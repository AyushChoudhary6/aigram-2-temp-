import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiToolsService } from '../services/aiToolsService';
import { useAuth } from '../context/AppContext';
import { AITool, AIToolCostEstimate } from '../types';

interface AIToolCardProps {
  tool: AITool;
  onPress?: (tool: AITool) => void;
  onExecute?: (tool: AITool) => void;
  showExecuteButton?: boolean;
}

export default function AIToolCard({
  tool,
  onPress,
  onExecute,
  showExecuteButton = true,
}: AIToolCardProps) {
  const { user, isGuestUser } = useAuth();
  
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const [costEstimate, setCostEstimate] = useState<AIToolCostEstimate | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 8,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    onPress?.(tool);
  };

  const handleExecute = async () => {
    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to use AI tools',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    onExecute?.(tool);
  };

  const loadCostEstimate = async () => {
    if (isLoadingCost || costEstimate) return;
    
    setIsLoadingCost(true);
    try {
      const response = await aiToolsService.getAIToolCostEstimate(tool.toolId, "Sample prompt for estimation");
      if (response.success) {
        setCostEstimate(response.data);
      }
    } catch (error) {
      console.error('Error loading cost estimate:', error);
    } finally {
      setIsLoadingCost(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#059669';
      case 'PENDING': return '#F59E0B';
      case 'REJECTED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'text_generation': return 'document-text';
      case 'text_processing': return 'text';
      case 'code_generation': return 'code-slash';
      case 'image_processing': return 'image';
      default: return 'sparkles';
    }
  };

  return (
    <TouchableWithoutFeedback 
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getCategoryIcon(tool.category) as any}
              size={20}
              color="#1BCC8F"
            />
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {tool.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              by {tool.authorName || 'AI Creator'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tool.status) }]}>
            <Text style={styles.statusText}>{tool.status}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {tool.description}
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={16} color="#6c757d" />
          <Text style={styles.statText}>{tool.usageCount} uses</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#ffc107" />
          <Text style={styles.statText}>
            {tool.freeCallsLimit > 0 ? `${tool.freeCallsLimit} free` : 'Premium'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="pricetag" size={16} color="#00D084" />
          <Text style={styles.statText}>
            {tool.costPerCall > 0 ? `$${tool.costPerCall.toFixed(3)}` : 'Free'}
          </Text>
        </View>
      </View>

      {/* Cost Estimate */}
      {costEstimate && (
        <View style={styles.costContainer}>
          <Text style={styles.costTitle}>Cost Estimate:</Text>
          <Text style={styles.costText}>
            {costEstimate.isFreeCall 
              ? `Free (${costEstimate.remainingFreeCalls} remaining)`
              : `$${costEstimate.estimatedPriceToUser.toFixed(4)} per use`
            }
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={loadCostEstimate}
          disabled={isLoadingCost}
        >
          {isLoadingCost ? (
            <ActivityIndicator size="small" color="#00D084" />
          ) : (
            <>
              <Ionicons name="information-circle" size={16} color="#00D084" />
              <Text style={styles.infoButtonText}>Details</Text>
            </>
          )}
        </TouchableOpacity>

        {showExecuteButton && (
          <TouchableOpacity
            style={[
              styles.executeButton,
              tool.status !== 'APPROVED' && styles.executeButtonDisabled
            ]}
            onPress={handleExecute}
            disabled={tool.status !== 'APPROVED'}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.executeButtonText}>
              {isGuestUser() ? 'Login to Use' : 'Execute'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Model Info */}
      <View style={styles.modelInfo}>
        <Text style={styles.modelText}>
          Model: {tool.openaiModel} â€¢ Max Tokens: {tool.maxTokens} â€¢ Temp: {tool.temperature}
        </Text>
      </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const BG = '#0D0D14';
const CARD_BG = 'rgba(255, 255, 255, 0.06)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const GREEN = '#00D084';
const TEXT_PRI = '#E8F5E8';
const TEXT_SEC = '#888888';
const TEXT_MUT = '#555555';

const styles = StyleSheet.create({
  container: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GREEN + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRI,
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: TEXT_SEC,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: TEXT_SEC,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: TEXT_MUT,
    marginLeft: 4,
  },
  costContainer: {
    backgroundColor: BORDER,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  costTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SEC,
    marginBottom: 2,
  },
  costText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: 'transparent',
  },
  infoButtonText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '600',
    marginLeft: 4,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: GREEN,
  },
  executeButtonDisabled: {
    backgroundColor: TEXT_MUT,
  },
  executeButtonText: {
    fontSize: 12,
    color: '#0D0D14',
    fontWeight: '700',
    marginLeft: 4,
  },
  modelInfo: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  modelText: {
    fontSize: 10,
    color: TEXT_MUT,
    textAlign: 'center',
  },
});

