import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  useWindowDimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { User, AITool, AIToolExecutionResponse } from '../../types';
import { aiToolsService } from '../../services/aiToolsService';
import { authService } from '../../services/authService';
import { AUTH_CONFIG } from '../../constants';

interface AIToolsScreenProps {
  user: User;
}

interface HistoryGroup {
  [key: string]: AIToolExecutionResponse[];
}

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = Math.min(300, SCREEN_W * 0.24);
const MOBILE_BREAKPOINT = 900;

// Helper function to categorize history by date
const categorizeHistoryByDate = (items: AIToolExecutionResponse[]): HistoryGroup => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups: HistoryGroup = {
    TODAY: [],
    YESTERDAY: [],
    'PREVIOUS 7 DAYS': [],
    OLDER: [],
  };

  items.forEach(item => {
    const itemDate = new Date(item.executedAt || Date.now());
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    if (itemDateOnly.getTime() === today.getTime()) {
      groups.TODAY.push(item);
    } else if (itemDateOnly.getTime() === yesterday.getTime()) {
      groups.YESTERDAY.push(item);
    } else if (itemDateOnly.getTime() >= sevenDaysAgo.getTime()) {
      groups['PREVIOUS 7 DAYS'].push(item);
    } else {
      groups.OLDER.push(item);
    }
  });

  return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
};

export default function AIToolsScreen({ user }: AIToolsScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const drawerWidth = Math.min(280, width * 0.78);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{id: string; role: 'user' | 'assistant'; text: string}[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // State for API data
  const [popularTools, setPopularTools] = useState<AITool[]>([]);
  const [usageHistory, setUsageHistory] = useState<AIToolExecutionResponse[]>([]);
  const [categorizedHistory, setCategorizedHistory] = useState<HistoryGroup>({});
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Ensure user is authenticated (guest or registered)
  useEffect(() => {
    ensureAuthenticated();
  }, []);

  const ensureAuthenticated = async () => {
    try {
      // Check if guest token exists in AsyncStorage
      const existingGuestToken = await AsyncStorage.getItem('aigram_guest_token');
      
      // If no guest token at all, authenticate as guest
      if (!existingGuestToken) {
        console.log('ðŸ”‘ No authentication found, authenticating as guest...');
        const response = await authService.authenticateAsGuest();
        if (response.success) {
          console.log('âœ… Guest authentication successful');
        } else {
          console.warn('âš ï¸ Guest authentication failed but continuing');
        }
      } else {
        console.log('âœ… Guest token already exists');
      }
    } catch (error) {
      console.error('Error ensuring authentication:', error);
      // Continue anyway - let the API calls handle auth failures
    }
  };

  // Fetch popular AI tools
  useEffect(() => {
    loadPopularTools();
  }, []);

  // Fetch user's AI tool usage history
  useEffect(() => {
    loadUsageHistory();
  }, []);

  const loadPopularTools = async () => {
    try {
      setIsLoadingTools(true);
      setToolsError(null);
      const response = await aiToolsService.getPopularAITools(0, 6);
      if (response.success) {
        setPopularTools(response.data.content);
      } else {
        setToolsError(response.message || 'Failed to load popular tools');
      }
    } catch (error: any) {
      console.error('Error loading popular tools:', error);
      setToolsError(error.message || 'Failed to load popular tools');
      // Fallback data
      setPopularTools([
        {
          toolId: '1',
          name: 'Generate Images',
          description: 'Create AI art and visuals',
          category: 'IMAGE_PROCESSING',
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        {
          toolId: '2',
          name: 'Write Code',
          description: 'Build apps and automate',
          category: 'CODE_GENERATION',
          isPublic: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      ]);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const loadUsageHistory = async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryError(null);
      const response = await aiToolsService.getUsageHistory(0, 50);
      if (response.success) {
        const history = response.data.content;
        setUsageHistory(history);
        const categorized = categorizeHistoryByDate(history);
        setCategorizedHistory(categorized);
      } else {
        setHistoryError(response.message || 'Failed to load history');
      }
    } catch (error: any) {
      console.error('Error loading usage history:', error);
      setHistoryError(error.message || 'Failed to load history');
      // Empty history is okay - user may not have any executions yet
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = () => {
    if (inputText.trim()) {
      const userMessage = { id: Date.now().toString(), role: 'user' as const, text: inputText.trim() };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // Simulate bot response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'This is an AI response placeholder. AI execution integration has not been connected to this marketplace yet.'
        }]);
      }, 1000);
    }
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      slideAnim.setValue(-drawerWidth);
      backdropAnim.setValue(0);
    }
  }, [backdropAnim, drawerWidth, isDrawerOpen, slideAnim]);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 16,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setIsDrawerOpen(false));
  };

  const renderSidebar = (inDrawer = false) => (
    <View style={[styles.sidebar, inDrawer && styles.drawerSidebar]}>
      {inDrawer && (
        <View style={styles.drawerTopRow}>
          <TouchableOpacity style={styles.drawerCloseBtn} activeOpacity={0.75} onPress={closeDrawer}>
            <Ionicons name="close" size={18} color="#9AA4BD" />
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.newChatBtn} activeOpacity={0.8} onPress={() => {
        setMessages([]);
        setActiveChatId(null);
        if (isMobile) closeDrawer();
      }}>
        <Ionicons name="add" size={16} color="#DEE7F7" />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.historyScroll}>
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#00D084" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : Object.keys(categorizedHistory).length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIconWrap}>
              <Ionicons name="chatbubbles-outline" size={28} color="#3D4B68" />
            </View>
            <Text style={styles.emptyStateText}>No history yet</Text>
            <Text style={styles.emptyStateSubtext}>Your AI tool executions will appear here</Text>
          </View>
        ) : (
          (Object.entries(categorizedHistory) as [string, AIToolExecutionResponse[]][]).map(
            ([section, items]) => (
              <View key={section} style={styles.historySection}>
                <Text style={styles.historySectionLabel}>{section}</Text>
                {items.map(item => (
                  <TouchableOpacity
                    key={item.executionId}
                    style={[styles.historyItem, activeChatId === item.executionId && styles.historyItemActive]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setActiveChatId(item.executionId);
                      if (isMobile) closeDrawer();
                    }}
                  >
                    <View style={styles.historyItemRow}>
                      <Ionicons name="chatbubble-outline" size={13} color="#4F5B78" style={{ marginRight: 8 }} />
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {item.toolName || 'AI Tool Execution'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )
        )}
      </ScrollView>

      {/* Sidebar footer */}
      <View style={styles.sidebarFooter}>
        <View style={styles.sidebarFooterDivider} />
        <View style={styles.sidebarUserRow}>
          <View style={styles.sidebarAvatar}>
            <Text style={styles.sidebarAvatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.sidebarUserName} numberOfLines={1}>{user?.name || 'User'}</Text>
        </View>
      </View>
    </View>
  );

  const quickSuggestions = [
    { icon: 'image-outline' as const, label: 'Generate an image', color: '#8B5CF6' },
    { icon: 'code-slash-outline' as const, label: 'Write some code', color: '#F59E0B' },
    { icon: 'document-text-outline' as const, label: 'Create content', color: '#00D084' },
    { icon: 'analytics-outline' as const, label: 'Analyze data', color: '#3B82F6' },
  ];

  return (
    <View style={[styles.root, { paddingTop: isMobile ? insets.top : 0, paddingBottom: isMobile ? insets.bottom + 90 : 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#080B11" />

      {/* Blurred background content (non-interactive) */}
      <View style={{ flex: 1, opacity: 0.12 }} pointerEvents="none">
      <View style={styles.layout}>
        {!isMobile && renderSidebar()}

        <View style={styles.main}>
          {/* Header */}
          <View style={styles.headerBar}>
            {isMobile && (
              <TouchableOpacity
                style={styles.headerMenuBtn}
                activeOpacity={0.75}
                onPress={() => {
                  if (isDrawerOpen) closeDrawer();
                  else openDrawer();
                }}
              >
                <Ionicons name="menu-outline" size={20} color="#778097" />
              </TouchableOpacity>
            )}
            <View style={styles.headerCenter}>
              <View style={styles.headerDot} />
              <Text style={styles.headerTitle}>AI Marketplace</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.7}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#778097" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Chat Area */}
          <View style={styles.chatAreaWrapper}>
            <View style={styles.chatAreaInner}>
              <ScrollView
                style={styles.scrollArea}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[messages.length === 0 && styles.heroContent]}
                keyboardShouldPersistTaps="handled"
              >
                {messages.length === 0 ? (
                  <>
                    {/* Hero */}
                    <View style={styles.heroSection}>
                      <View style={styles.heroIconWrapper}>
                        <View style={styles.heroIconOuter}>
                          <View style={styles.heroIconBg}>
                            <Ionicons name={"sparkles" as any} size={28} color="#00D084" />
                          </View>
                        </View>
                      </View>

                      <Text style={styles.heroTitle}>What can I help you create?</Text>
                      <Text style={styles.heroSubtitle}>
                        I can generate images, write code, create content, and help you build your AI-powered business.
                      </Text>
                    </View>

                    {/* Quick Suggestions */}
                    <View style={[styles.suggestionsGrid, isMobile && styles.suggestionsGridMobile]}>
                      {quickSuggestions.map((s, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[styles.suggestionCard, isMobile && styles.suggestionCardMobile]}
                          activeOpacity={0.75}
                          onPress={() => setInputText(s.label)}
                        >
                          <View style={[styles.suggestionIconBox, { backgroundColor: s.color + '18' }]}> 
                            <Ionicons name={s.icon} size={20} color={s.color} />
                          </View>
                          <Text style={styles.suggestionText}>{s.label}</Text>
                          <Ionicons name="arrow-forward" size={14} color="#4F5B78" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Popular Tools */}
                    {!isLoadingTools && !toolsError && popularTools.length > 0 && (
                      <View style={styles.popularSection}>
                        <Text style={styles.popularTitle}>Popular Tools</Text>
                        <View style={[styles.cardsRow, isMobile && styles.cardsRowMobile]}>
                          {popularTools.map(tool => (
                            <TouchableOpacity key={tool.toolId} style={styles.featureCard} activeOpacity={0.8} onPress={() => {
                              setInputText(`Execute ${tool.name}`);
                            }}>
                              <View style={styles.featureIconBox}>
                                <Ionicons 
                                  name={
                                    tool.category === 'IMAGE_PROCESSING' ? 'image-outline' :
                                    tool.category === 'CODE_GENERATION' ? 'code-slash-outline' :
                                    'star-outline'
                                  } 
                                  size={18} 
                                  color="#00D084" 
                                />
                              </View>
                              <View style={styles.featureCardBody}>
                                <Text style={styles.featureCardTitle}>{tool.name}</Text>
                                <Text style={styles.featureCardDesc}>{tool.description || 'AI-powered tool'}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {toolsError && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={28} color="#E74C3C" />
                        <Text style={styles.errorText}>Network error. Please check your connection.</Text>
                        <Text style={styles.guestNote}>ðŸ’¡ Tip: Some features may be limited for guest users. Login for full access.</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={loadPopularTools}>
                          <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.messagesContainer}>
                    {messages.map(msg => (
                      <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.messageUser : styles.messageAssistant]}>
                        {msg.role === 'assistant' && (
                          <View style={styles.assistantAvatar}>
                            <Ionicons name="sparkles" size={14} color="#00D084" />
                          </View>
                        )}
                        <View style={[styles.messageContent, msg.role === 'user' ? styles.messageContentUser : styles.messageContentAssistant]}>
                          <Text style={[styles.messageText, msg.role === 'user' ? styles.messageTextUser : styles.messageTextAssistant]}>
                            {msg.text}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Input Bar */}
              <View style={styles.bottomPanel}>
                <View style={styles.inputRow}>
                  <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
                    <Ionicons name="add-circle-outline" size={22} color="#4F5B78" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Message AI Marketplace..."
                    placeholderTextColor="#4F5B78"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-up" size={18} color="#080B11" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputDisclaimer}>AI Marketplace can make mistakes. Verify important information.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {isMobile && isDrawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.drawerOverlay, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>
      )}
      {isMobile && (
        <Animated.View
          pointerEvents={isDrawerOpen ? 'auto' : 'none'}
          style={[
            styles.drawerPanel,
            { width: drawerWidth, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {renderSidebar(true)}
        </Animated.View>
      )}
      </View>

      {/* Coming Soon Overlay */}
      <View style={styles.comingSoonOverlay}>
        <View style={styles.comingSoonContent}>
          <View style={styles.comingSoonIconWrap}>
            <Ionicons name="hourglass-outline" size={56} color="#00D084" />
          </View>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtitle}>
            The AI Marketplace is currently under development.{'\n'}Stay tuned for exciting updates!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0B0B0B',
  },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerSidebar: {
    width: '100%',
    height: '100%',
    borderRightColor: '#1A1A1A',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 18,
  },
  drawerTopRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D2740',
    backgroundColor: '#141414',
    paddingVertical: 11,
    marginBottom: 18,
  },
  newChatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DEE7F7',
    marginLeft: 6,
  },
  historyScroll: {
    flex: 1,
  },
  historySection: {
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  historySectionLabel: {
    fontSize: 11,
    color: '#4F5B78',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  historyItem: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  historyItemActive: {
    backgroundColor: '#161616',
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#C0CAE0',
    flex: 1,
  },
  sidebarFooter: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  sidebarFooterDivider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginBottom: 14,
  },
  sidebarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sidebarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sidebarAvatarText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarUserName: {
    color: '#C0CAE0',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Main content
  main: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D084',
    marginRight: 10,
  },
  headerTitle: {
    color: '#E8EEF9',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat area
  chatAreaWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chatAreaInner: {
    flex: 1,
    width: '100%',
    maxWidth: 820,
  },
  scrollArea: {
    flex: 1,
  },
  heroContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 24,
  },

  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroIconWrapper: {
    marginBottom: 24,
  },
  heroIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 211, 148, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 211, 148, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 211, 148, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#E8EEF9',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5C6782',
    textAlign: 'center',
    maxWidth: 480,
  },

  // Suggestions grid
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    maxWidth: 700,
    marginBottom: 32,
  },
  suggestionsGridMobile: {
    flexDirection: 'column',
    maxWidth: 400,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D2740',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flex: 1,
    minWidth: 280,
  },
  suggestionCardMobile: {
    minWidth: 'auto',
  },
  suggestionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0CAE0',
    flex: 1,
  },

  // Popular tools
  popularSection: {
    width: '100%',
    maxWidth: 700,
  },
  popularTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F5B78',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    flexWrap: 'wrap',
  },
  cardsRowMobile: {
    flexDirection: 'column',
  },
  featureCard: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D2740',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16,211,148,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureCardBody: {
    flex: 1,
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8EEF9',
    marginBottom: 2,
  },
  featureCardDesc: {
    fontSize: 12,
    color: '#5C6782',
  },

  // Messages
  messagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    maxWidth: '85%',
    alignItems: 'flex-start',
  },
  messageUser: {
    alignSelf: 'flex-end',
  },
  messageAssistant: {
    alignSelf: 'flex-start',
  },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 211, 148, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 211, 148, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  messageContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  messageContentUser: {
    backgroundColor: '#1E1E1E',
    borderBottomRightRadius: 4,
  },
  messageContentAssistant: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
  },
  messageTextUser: {
    color: '#F8FAFC',
  },
  messageTextAssistant: {
    color: '#CCCCCC',
  },

  // Bottom input
  bottomPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 88 : 95,
    backgroundColor: '#0B0B0B',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1D2740',
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 5,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#E8EEF9',
    minHeight: 30,
    paddingHorizontal: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D084',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
  inputDisclaimer: {
    fontSize: 11,
    color: '#3D4B68',
    textAlign: 'center',
    marginTop: 10,
  },

  // Drawer
  drawerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 20,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 12, 0.7)',
    zIndex: 20,
  },

  // Loading & Error States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingCardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#4F5B78',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyStateIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6782',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#3D4B68',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00D084',
    backgroundColor: 'transparent',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D084',
  },
  guestNote: {
    fontSize: 12,
    color: '#00D084',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 11, 11, 0.85)',
    zIndex: 50,
  },
  comingSoonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  comingSoonIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  comingSoonTitle: {
    color: '#E8EEF9',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  comingSoonSubtitle: {
    color: '#5C6782',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
  },
});



