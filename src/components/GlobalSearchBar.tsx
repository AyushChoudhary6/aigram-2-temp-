import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Keyboard,
  Dimensions,
  Platform,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { ROUTES } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Result types ──────────────────────────────────────────────

type ResultCategory = 'screen' | 'video' | 'challenge' | 'prompt';

interface SearchResult {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: ResultCategory;
  /** route to navigate to */
  route: string;
  /** for tab screens */
  tab?: boolean;
  /** extra badge text (difficulty / xp) */
  badge?: string;
  badgeColor?: string;
}

// ── Static screen items ───────────────────────────────────────

const SCREEN_ITEMS: SearchResult[] = [
  { id: 'nav_home', label: 'Home', description: 'Video feed & reels', icon: 'home-outline', route: ROUTES.HOME, tab: true, category: 'screen' },
  { id: 'nav_practice', label: 'Practice', description: 'Coding practice problems', icon: 'code-slash-outline', route: ROUTES.PRACTICE, tab: true, category: 'screen' },
  { id: 'nav_ai_tools', label: 'AI Marketplace', description: 'AI tools & services', icon: 'grid-outline', route: ROUTES.AI_TOOLS, tab: true, category: 'screen' },
  { id: 'nav_profile', label: 'Profile', description: 'Your profile & stats', icon: 'person-outline', route: ROUTES.PROFILE, tab: true, category: 'screen' },
  { id: 'nav_gamified', label: 'Gamified Practice', description: 'Challenges & leaderboard', icon: 'trophy-outline', route: ROUTES.GAMIFIED_PRACTICE, category: 'screen' },
  { id: 'nav_wallet', label: 'Wallet', description: 'Coins & transactions', icon: 'wallet-outline', route: ROUTES.WALLET, category: 'screen' },
  { id: 'nav_settings', label: 'Settings', description: 'App settings & preferences', icon: 'settings-outline', route: ROUTES.SETTINGS, category: 'screen' },
];

// ── Practice video levels (mirrors PracticeScreen data) ───────

const PRACTICE_VIDEO_ITEMS: SearchResult[] = [
  { id: 'pv_1', label: '99% of Beginners Don\'t Know the Basics of AI', description: 'EASY · +50 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'EASY', badgeColor: '#00D084' },
  { id: 'pv_2', label: 'Build your own AI chatbot in 2 minutes without code', description: 'EASY · +100 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'EASY', badgeColor: '#00D084' },
  { id: 'pv_3', label: 'Free AI PDF Summarizer - Generate Summaries in Seconds', description: 'EASY · +150 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'EASY', badgeColor: '#00D084' },
  { id: 'pv_4', label: 'Get Free API Keys for Any AI Model', description: 'MEDIUM · +200 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'MEDIUM', badgeColor: '#F59E0B' },
  { id: 'pv_5', label: 'How to Create Your Own AI Assistant (No Code)', description: 'MEDIUM · +250 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'MEDIUM', badgeColor: '#F59E0B' },
  { id: 'pv_6', label: 'Master the Perfect ChatGPT Prompt Formula', description: 'MEDIUM · +300 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'MEDIUM', badgeColor: '#F59E0B' },
  { id: 'pv_7', label: 'Prompt Engineering', description: 'HARD · +350 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'HARD', badgeColor: '#EF4444' },
  { id: 'pv_8', label: 'Secrets to Creating Stunning AI Images Expert Prompts', description: 'HARD · +400 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'HARD', badgeColor: '#EF4444' },
  { id: 'pv_9', label: 'Training Your Own AI Model Is Not As Hard As You Think', description: 'HARD · +450 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'HARD', badgeColor: '#EF4444' },
  { id: 'pv_10', label: 'What is Artificial Intelligence? AI Explained in 5 Minutes', description: 'HARD · +500 XP · AI Concepts', icon: 'play-circle-outline', route: ROUTES.PRACTICE, tab: true, category: 'video', badge: 'HARD', badgeColor: '#EF4444' },
];

// ── Prompt challenges ─────────────────────────────────────────

const PROMPT_CHALLENGE_ITEMS: SearchResult[] = [
  { id: 'pc_1', label: 'Create an image of a horse flying in the sky', description: 'Prompt Challenge · Creative', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_2', label: 'Write a polite email asking for sick leave', description: 'Prompt Challenge · Professional', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_3', label: 'Explain how a microwave works to a 7-year-old', description: 'Prompt Challenge · Educational', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_4', label: 'Write a professional resignation letter', description: 'Prompt Challenge · Professional', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_5', label: 'Generate a Python script to reverse a string', description: 'Prompt Challenge · Coding', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_6', label: 'Write a catchy Instagram caption for a beach vacation', description: 'Prompt Challenge · Creative', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_7', label: 'Summarize the plot of The Matrix in 3 sentences', description: 'Prompt Challenge · Summarization', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_8', label: 'Create a 3-day workout plan for a beginner', description: 'Prompt Challenge · Health', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_9', label: 'Generate a Midjourney prompt for a cyberpunk city', description: 'Prompt Challenge · AI Art', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_10', label: 'Write a LinkedIn connection message to a recruiter', description: 'Prompt Challenge · Professional', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_11', label: 'Explain the difference between React and Angular', description: 'Prompt Challenge · Tech', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
  { id: 'pc_12', label: 'Draft a short sci-fi story about a robot learning to feel', description: 'Prompt Challenge · Creative', icon: 'bulb-outline', route: ROUTES.PRACTICE, tab: true, category: 'prompt' },
];

// ── All searchable content ────────────────────────────────────

const ALL_ITEMS: SearchResult[] = [
  ...SCREEN_ITEMS,
  ...PRACTICE_VIDEO_ITEMS,
  ...PROMPT_CHALLENGE_ITEMS,
];

// Section headers
const SECTION_META: Record<ResultCategory, { title: string; icon: keyof typeof Ionicons.glyphMap }> = {
  screen: { title: 'Screens', icon: 'apps-outline' },
  video: { title: 'Practice Videos', icon: 'play-circle-outline' },
  challenge: { title: 'Challenges', icon: 'trophy-outline' },
  prompt: { title: 'Prompt Challenges', icon: 'bulb-outline' },
};

const GlobalSearchBar: React.FC = () => {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const animValue = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const expand = useCallback(() => {
    setExpanded(true);
    Animated.spring(animValue, {
      toValue: 1,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start(() => {
      inputRef.current?.focus();
    });
  }, [animValue]);

  const collapse = useCallback(() => {
    Keyboard.dismiss();
    Animated.spring(animValue, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start(() => {
      setExpanded(false);
      setQuery('');
      setResults([]);
    });
  }, [animValue]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = ALL_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower)
    );
    setResults(filtered);
  }, []);

  // Group results by category for sectioned display
  const sections = useMemo(() => {
    if (results.length === 0) return [];
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups).map(([cat, data]) => ({
      title: SECTION_META[cat as ResultCategory]?.title ?? cat,
      icon: SECTION_META[cat as ResultCategory]?.icon ?? 'ellipse-outline',
      data,
    }));
  }, [results]);

  const handleSelect = useCallback(
    (item: SearchResult) => {
      collapse();
      setTimeout(() => {
        if (item.tab) {
          navigation.navigate(ROUTES.TAB_NAVIGATOR, { screen: item.route });
        } else {
          navigation.navigate(item.route);
        }
      }, 200);
    },
    [collapse, navigation]
  );

  const inputOpacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const bgOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.95],
  });

  const renderResultRow = (item: SearchResult) => (
    <TouchableOpacity key={item.id} style={styles.resultRow} onPress={() => handleSelect(item)}>
      <View style={styles.resultIcon}>
        <Ionicons name={item.icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.resultText}>
        <Text style={styles.resultLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.resultDesc} numberOfLines={1}>{item.description}</Text>
      </View>
      {item.badge && (
        <View style={[styles.badge, { backgroundColor: `${item.badgeColor ?? COLORS.primary}20` }]}>
          <Text style={[styles.badgeText, { color: item.badgeColor ?? COLORS.primary }]}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  const renderSectionItem = useCallback(({ item }: { item: SearchResult }) => renderResultRow(item), [handleSelect]);

  return (
    <>
      {/* Collapsed: just the search icon */}
      {!expanded && (
        <TouchableOpacity
          style={styles.collapsedButton}
          onPress={expand}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="search" size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Expanded: full-screen overlay */}
      {expanded && (
        <View style={styles.expandedOverlay} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={collapse} />
          </Animated.View>

          {/* Search content */}
          <View style={styles.expandedContent}>
            {/* Search bar */}
            <Animated.View style={[styles.expandedBar, { opacity: inputOpacity }]}>
              <TouchableOpacity style={styles.backButton} onPress={collapse}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Search videos, challenges, screens…"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={query}
                onChangeText={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
                selectionColor={COLORS.primary}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Sectioned search results */}
            {sections.length > 0 && (
              <View style={styles.dropdown}>
                <SectionList
                  sections={sections}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                      <Ionicons name={section.icon as any} size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionCount}>{section.data.length}</Text>
                    </View>
                  )}
                  renderItem={renderSectionItem}
                  stickySectionHeadersEnabled={false}
                />
              </View>
            )}

            {/* Empty search state */}
            {query.length > 0 && results.length === 0 && (
              <View style={styles.dropdown}>
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={28} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No results for "{query}"</Text>
                </View>
              </View>
            )}

            {/* Quick suggestions (empty query) */}
            {query.length === 0 && (
              <View style={styles.dropdown}>
                <Text style={styles.suggestionsTitle}>Quick Navigation</Text>
                {SCREEN_ITEMS.map(renderResultRow)}
                <Text style={[styles.suggestionsTitle, { marginTop: 4 }]}>Popular Practice Videos</Text>
                {PRACTICE_VIDEO_ITEMS.slice(0, 3).map(renderResultRow)}
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  collapsedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedOverlay: {
    position: 'absolute',
    top: 0,
    left: -16,
    right: -16,
    bottom: -SCREEN_WIDTH * 3,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  expandedContent: {
    paddingHorizontal: 16,
    zIndex: 101,
  },
  expandedBar: {
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingRight: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSizes.base,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  clearButton: {
    padding: 4,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 380,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.4)',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
  suggestionsTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    gap: 12,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,208,132,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultLabel: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  resultDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
});

export default GlobalSearchBar;
