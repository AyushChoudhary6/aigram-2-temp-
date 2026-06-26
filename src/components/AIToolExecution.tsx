import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiToolsService } from '../services/aiToolsService';
import { useAuth } from '../context/AppContext';
import { AITool, AIToolExecutionResponse, AIToolCostEstimate } from '../types';

interface AIToolExecutionProps {
  tool: AITool;
  onExecutionComplete?: (result: AIToolExecutionResponse) => void;
  onClose?: () => void;
}

export default function AIToolExecution({
  tool,
  onExecutionComplete,
  onClose,
}: AIToolExecutionProps) {
  const { user, isGuestUser } = useAuth();
  
  const [inputPrompt, setInputPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const [executionResult, setExecutionResult] = useState<AIToolExecutionResponse | null>(null);
  const [costEstimate, setCostEstimate] = useState<AIToolCostEstimate | null>(null);
  const [showCostEstimate, setShowCostEstimate] = useState(false);

  const loadCostEstimate = async () => {
    if (!inputPrompt.trim() || isLoadingCost) return;
    
    setIsLoadingCost(true);
    try {
      const response = await aiToolsService.getAIToolCostEstimate(tool.toolId, inputPrompt.trim());
      if (response.success) {
        setCostEstimate(response.data);
        setShowCostEstimate(true);
      }
    } catch (error) {
      console.error('Error loading cost estimate:', error);
      Alert.alert('Error', 'Failed to get cost estimate');
    } finally {
      setIsLoadingCost(false);
    }
  };

  const handleExecute = async () => {
    if (!inputPrompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to execute AI tools',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    // Show cost confirmation if not free
    if (costEstimate && !costEstimate.isFreeCall && costEstimate.estimatedPriceToUser > 0) {
      Alert.alert(
        'Confirm Execution',
        `This will cost $${costEstimate.estimatedPriceToUser.toFixed(4)}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Execute', onPress: executeAITool }
        ]
      );
    } else {
      executeAITool();
    }
  };

  const executeAITool = async () => {
    setIsExecuting(true);
    try {
      const response = await aiToolsService.executeAITool(tool.toolId, {
        inputPrompt: inputPrompt.trim()
      });
      
      if (response.success) {
        setExecutionResult(response.data);
        onExecutionComplete?.(response.data);
        
        // Show success message
        Alert.alert(
          'Execution Complete',
          `Tool executed successfully! ${response.data.isFreeCall ? 'Free call used.' : `Cost: $${response.data.costIncurred.toFixed(4)}`}`
        );
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error executing AI tool:', error);
      Alert.alert('Execution Failed', error.message || 'Failed to execute AI tool');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setInputPrompt('');
    setExecutionResult(null);
    setCostEstimate(null);
    setShowCostEstimate(false);
  };

  const copyToClipboard = (text: string) => {
    // In a real app, you'd use Clipboard from @react-native-clipboard/clipboard
    Alert.alert('Copied', 'Result copied to clipboard');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.toolIcon}>
            <Ionicons name="sparkles" size={20} color="#00D084" />
          </View>
          <View>
            <Text style={styles.toolTitle}>{tool.title}</Text>
            <Text style={styles.toolAuthor}>by {tool.authorName || 'AI Creator'}</Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#555555" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{tool.description}</Text>
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Prompt</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your prompt here..."
            value={inputPrompt}
            onChangeText={setInputPrompt}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isExecuting}
          />
          <Text style={styles.characterCount}>
            {inputPrompt.length} characters
          </Text>
        </View>

        {/* Cost Estimate */}
        {showCostEstimate && costEstimate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Estimate</Text>
            <View style={styles.costContainer}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Estimated Cost:</Text>
                <Text style={[
                  styles.costValue,
                  { color: costEstimate.isFreeCall ? '#00D084' : '#00D084' }
                ]}>
                  {costEstimate.isFreeCall 
                    ? `Free (${costEstimate.remainingFreeCalls} remaining)`
                    : `$${costEstimate.estimatedPriceToUser.toFixed(4)}`
                  }
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Model:</Text>
                <Text style={styles.costValue}>{costEstimate.openaiModel}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Price Multiplier:</Text>
                <Text style={styles.costValue}>{costEstimate.priceMultiplier}x</Text>
              </View>
            </View>
          </View>
        )}

        {/* Execution Result */}
        {executionResult && (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Result</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(executionResult.outputResponse)}
              >
                <Ionicons name="copy" size={16} color="#00D084" />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.resultContainer}>
              <ScrollView style={styles.resultScroll} nestedScrollEnabled>
                <Text style={styles.resultText}>{executionResult.outputResponse}</Text>
              </ScrollView>
            </View>

            {/* Execution Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color="#555555" />
                <Text style={styles.statText}>
                  {(executionResult.executionTime / 1000).toFixed(2)}s
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flash" size={16} color="#555555" />
                <Text style={styles.statText}>
                  {executionResult.tokensUsed} tokens
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="card" size={16} color="#555555" />
                <Text style={styles.statText}>
                  {executionResult.isFreeCall 
                    ? 'Free' 
                    : `$${executionResult.costIncurred.toFixed(4)}`
                  }
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tool Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.configContainer}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Model:</Text>
              <Text style={styles.configValue}>{tool.openaiModel}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Max Tokens:</Text>
              <Text style={styles.configValue}>{tool.maxTokens}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Temperature:</Text>
              <Text style={styles.configValue}>{tool.temperature}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Free Calls:</Text>
              <Text style={styles.configValue}>{tool.freeCallsLimit}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.estimateButton}
          onPress={loadCostEstimate}
          disabled={!inputPrompt.trim() || isLoadingCost || isExecuting}
        >
          {isLoadingCost ? (
            <ActivityIndicator size="small" color="#00D084" />
          ) : (
            <>
              <Ionicons name="calculator" size={16} color="#00D084" />
              <Text style={styles.estimateButtonText}>Get Estimate</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          disabled={isExecuting}
        >
          <Ionicons name="refresh" size={16} color="#555555" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.executeButton,
            (!inputPrompt.trim() || isExecuting) && styles.executeButtonDisabled
          ]}
          onPress={handleExecute}
          disabled={!inputPrompt.trim() || isExecuting}
        >
          {isExecuting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="play" size={16} color="white" />
              <Text style={styles.executeButtonText}>Execute</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  toolAuthor: {
    fontSize: 12,
    color: '#555555',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#E8F5E8',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'right',
    marginTop: 4,
  },
  costContainer: {
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#555555',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#00D084',
    marginLeft: 4,
  },
  resultContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    height: 200,
    marginBottom: 12,
  },
  resultScroll: {
    flex: 1,
    padding: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#555555',
    marginLeft: 4,
  },
  configContainer: {
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 14,
    color: '#555555',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8F5E8',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: 8,
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00D084',
    backgroundColor: 'transparent',
  },
  estimateButtonText: {
    fontSize: 12,
    color: '#00D084',
    fontWeight: '500',
    marginLeft: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555555',
    backgroundColor: 'transparent',
  },
  resetButtonText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
    marginLeft: 4,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#00D084',
    flex: 1,
    justifyContent: 'center',
  },
  executeButtonDisabled: {
    backgroundColor: '#555555',
  },
  executeButtonText: {
    fontSize: 14,
    color: '#E8F5E8',
    fontWeight: '600',
    marginLeft: 4,
  },
});


