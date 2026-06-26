import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

const DRAWER_W = 300;

interface Project {
  id: string;
  name: string;
  type: 'code' | 'content' | 'automation';
  status: 'In Progress' | 'Active' | 'Complete';
  progress: number;
  lastUpdated: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const demoProjects: Project[] = [
  { id: '1', name: 'AI SaaS Dashboard',        type: 'code',       status: 'In Progress', progress: 65,  lastUpdated: '2 hours ago' },
  { id: '2', name: 'Product Launch Campaign',  type: 'content',    status: 'Active',      progress: 40,  lastUpdated: '1 day ago' },
  { id: '3', name: 'Customer Onboarding Flow', type: 'automation', status: 'Complete',    progress: 100, lastUpdated: '3 days ago' },
];

const quickActions = [
  { icon: 'code-slash'  as const, label: 'Build App',  desc: 'Create with AI',   color: '#7C3AED', bg: '#1E1036' },
  { icon: 'megaphone'   as const, label: 'Marketing',  desc: 'Generate content', color: '#EC4899', bg: '#200D1C' },
  { icon: 'git-network' as const, label: 'Automate',   desc: 'Build workflows',  color: '#8B5CF6', bg: '#1A0E35' },
  { icon: 'bar-chart'   as const, label: 'Analyze',    desc: 'Get insights',     color: '#1BCC8F', bg: '#0D2420' },
];

const dailyTasks = [
  { task: 'Review generated landing page', priority: 'high',   time: '9:00 AM' },
  { task: 'Approve social media posts',    priority: 'medium', time: '11:00 AM' },
  { task: 'Check automation metrics',      priority: 'low',    time: '2:00 PM' },
];

const projectIconMap: Record<Project['type'], keyof typeof Ionicons.glyphMap> = {
  code:       'code-slash',
  content:    'megaphone',
  automation: 'git-network',
};
const projectIconColor: Record<Project['type'], string> = {
  code:       '#7C3AED',
  content:    '#EC4899',
  automation: '#8B5CF6',
};
const statusBadgeColor: Record<Project['status'], string> = {
  'In Progress': '#1D4ED8',
  'Active':      '#059669',
  'Complete':    '#065F46',
};
const priorityDotColor: Record<string, string> = {
  high:   '#EF4444',
  medium: '#F59E0B',
  low:    '#10B981',
};

interface CofounderScreenProps {
  user: User;
}

const CofounderScreen: React.FC<CofounderScreenProps> = ({ user }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 1024;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const insets = useSafeAreaInsets();
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState('');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  const slideAnim    = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const flatListRef  = useRef<FlatList>(null);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 16 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const toggleDrawer = () => (drawerOpen ? closeDrawer() : openDrawer());

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message      = { id: Date.now().toString(),       role: 'user',      content: input };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: `I'll help you with "${input}".\n\nAs your AI co-founder I can build, market, automate and analyze. What aspect would you like to start with?` };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={[styles.projectCard, activeProject === item.id && styles.projectCardActive]}
      onPress={() => { setActiveProject(item.id); closeDrawer(); }}
      activeOpacity={0.75}
    >
      <View style={[styles.projectIcon, { backgroundColor: projectIconColor[item.type] + '22' }]}>
        <Ionicons name={projectIconMap[item.type]} size={20} color={projectIconColor[item.type]} />
      </View>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.projectMeta}>
          <View style={[styles.badge, { backgroundColor: statusBadgeColor[item.status] }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
          <Text style={styles.projectAge}>{item.lastUpdated}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${item.progress}%` as any }]} />
        </View>
        <Text style={styles.projectPercent}>{item.progress}%</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, item.role === 'user' ? styles.msgRowUser : styles.msgRowBot]}>
      {item.role === 'assistant' && (
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip" size={14} color="#1BCC8F" />
        </View>
      )}
      <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  const renderSidebarContent = () => (
    <>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerHeaderLeft}>
            <Ionicons name="rocket" size={15} color="#1BCC8F" />
            <Text style={styles.drawerHeaderTitle}>Your Projects</Text>
          </View>
          {!isDesktop && (
            <TouchableOpacity onPress={closeDrawer} style={styles.drawerCloseBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>3</Text>
              <Text style={styles.statLbl}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: '#E2E8F0' }]}>12</Text>
              <Text style={styles.statLbl}>Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: '#F59E0B' }]}>68%</Text>
              <Text style={styles.statLbl}>Progress</Text>
            </View>
          </View>

          <View style={styles.drawerSectionHeader}>
            <Ionicons name="layers-outline" size={13} color="#1BCC8F" />
            <Text style={styles.drawerSectionTitle}>Projects</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add-circle-outline" size={18} color="#1BCC8F" />
            </TouchableOpacity>
          </View>
          {demoProjects.map((item, index) => (
            <React.Fragment key={item.id || index}>{renderProject({ item })}</React.Fragment>
          ))}

          <View style={styles.drawerSectionHeader}>
            <Ionicons name="calendar-outline" size={13} color="#1BCC8F" />
            <Text style={styles.drawerSectionTitle}>Today's Tasks</Text>
          </View>
          {dailyTasks.map((t, i) => (
            <View key={i} style={styles.taskRow}>
              <View style={[styles.dot, { backgroundColor: priorityDotColor[t.priority] }]} />
              <View style={styles.taskBody}>
                <Text style={styles.taskText}>{t.task}</Text>
                <Text style={styles.taskTime}>{t.time}</Text>
              </View>
              <View style={[styles.priorityChip, { backgroundColor: priorityDotColor[t.priority] + '22' }]}>
                <Text style={[styles.priorityChipText, { color: priorityDotColor[t.priority] }]}>{t.priority}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: isDesktop ? 0 : insets.top, paddingBottom: isDesktop ? 0 : insets.bottom + 90, flexDirection: isDesktop ? 'row' : 'column' }]}>
      
      {isDesktop && (
        <View style={styles.desktopSidebar}>
          {renderSidebarContent()}
        </View>
      )}

      <View style={[styles.mainContentArea, { flex: 1 }]}>
        {!isDesktop && (
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.hamburgerBtn} onPress={toggleDrawer} activeOpacity={0.7}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={[styles.hamburgerLine, { width: 14 }]} />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Ionicons name="hardware-chip-outline" size={18} color="#1BCC8F" />
              <Text style={styles.topBarTitle}>AI Co-founder</Text>
            </View>
            <View style={styles.onlinePill}>
              <Ionicons name="star" size={11} color="#1BCC8F" />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        )}

      <KeyboardAvoidingView
        style={{ flex: 1, alignItems: isDesktop ? 'center' : 'stretch', backgroundColor: PANEL_BG }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 850 : '100%' }}>
        {messages.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.welcomeContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroIcon}>
              <Ionicons name="hardware-chip" size={44} color="#1BCC8F" />
            </View>
            <Text style={styles.heroTitle}>Your AI Co-founder</Text>
            <Text style={styles.heroSubtitle}>
              I'm here to help you build, market, and automate your business. Tell me what you need.
            </Text>
            <View style={styles.actionGrid}>
              {quickActions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.actionCard, { width: isDesktop ? '23%' : '47%' }]}
                  onPress={() => setInput(`Help me with ${a.label.toLowerCase()}`)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: a.bg }]}>
                    <Ionicons name={a.icon} size={24} color={a.color} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                  <Text style={styles.actionDesc}>{a.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.msgList}
            contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Tell me what you want to build..."
              placeholderTextColor="#555"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnOff]}
              onPress={handleSend}
              disabled={!input.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>Your AI co-founder is ready to help you build and grow.</Text>
        </View>
        
        </View>
      </KeyboardAvoidingView>

      {!isDesktop && drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {!isDesktop && (
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {renderSidebarContent()}
        </Animated.View>
      )}

      </View>
    </View>
  );
};

const BG       = '#0D0D14';
const PANEL_BG = '#111118';
const CARD_BG  = '#18181F';
const BORDER   = '#1F1F2E';
const GREEN    = '#1BCC8F';
const TEXT_PRI = '#E2E8F0';
const TEXT_SEC = '#6B7280';
const TEXT_MUT = '#374151';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  desktopSidebar: { width: DRAWER_W, borderRightWidth: 1, backgroundColor: BG, borderRightColor: BORDER },
  mainContentArea: { flex: 1, backgroundColor: PANEL_BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 5,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: TEXT_PRI,
  },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  topBarTitle:  { color: TEXT_PRI, fontSize: 15, fontWeight: '700' },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: CARD_BG,
  },
  onlineText: { color: TEXT_PRI, fontSize: 11, fontWeight: '600' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_W,
    backgroundColor: PANEL_BG,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 61,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  drawerHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerHeaderTitle: { color: TEXT_PRI, fontSize: 14, fontWeight: '700' },
  drawerCloseBtn:    { padding: 4 },
  drawerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  drawerSectionTitle: {
    flex: 1,
    color: TEXT_SEC,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addBtn: { padding: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '700', color: GREEN },
  statLbl: { fontSize: 10, color: TEXT_SEC, marginTop: 2, textAlign: 'center' },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  projectCardActive: { borderColor: GREEN },
  projectIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  projectInfo:    { flex: 1 },
  projectName:    { color: TEXT_PRI, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  projectMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  badge:          { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText:      { color: '#fff', fontSize: 9, fontWeight: '700' },
  projectAge:     { color: TEXT_SEC, fontSize: 9 },
  projectPercent: { color: TEXT_SEC, fontSize: 10, marginTop: 3 },
  progressTrack:  { height: 3, backgroundColor: '#1F2937', borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: GREEN, borderRadius: 2 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 10,
  },
  dot:              { width: 8, height: 8, borderRadius: 4 },
  taskBody:         { flex: 1 },
  taskText:         { color: TEXT_PRI, fontSize: 12, marginBottom: 2 },
  taskTime:         { color: TEXT_SEC, fontSize: 10 },
  priorityChip:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  priorityChipText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#0D2820',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: GREEN + '44',
  },
  heroTitle:    { color: TEXT_PRI, fontSize: 24, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  heroSubtitle: { color: TEXT_SEC, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  actionGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: { color: TEXT_PRI, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  actionDesc:  { color: TEXT_SEC, fontSize: 11 },
  msgList:        { flex: 1 },
  msgRow:         { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowUser:     { justifyContent: 'flex-end' },
  msgRowBot:      { justifyContent: 'flex-start' },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#0D2820',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, borderWidth: 1, borderColor: GREEN + '44',
  },
  bubble:         { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:     { backgroundColor: GREEN },
  bubbleBot:      { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER },
  bubbleText:     { fontSize: 13, lineHeight: 19 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot:  { color: TEXT_PRI },
  inputArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 88,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    color: TEXT_PRI,
    fontSize: 13,
    maxHeight: 90,
    paddingVertical: 8,
  },
  sendBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendBtnOff: { backgroundColor: TEXT_MUT },
  inputHint:  { color: TEXT_SEC, fontSize: 11, textAlign: 'center' },
});

export default CofounderScreen;
