import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarWeek(date: Date) {
  const today = date.getDay();
  const week: { dayName: string; dayNum: number; isToday: boolean; date: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() - today + i);
    week.push({
      dayName: DAY_NAMES[i],
      dayNum: d.getDate(),
      isToday: d.toDateString() === date.toDateString(),
      date: d,
    });
  }
  return week;
}

interface Props {
  route?: {
    params?: {
      currentLevel?: number;
      currentXP?: number;
      doneCount?: number;
      totalCount?: number;
      streakDays?: number;
    };
  };
}

export default function ChallengeDetailScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = route?.params || {};

  const level = params.currentLevel || 1;
  const xp = params.currentXP || 0;
  const done = params.doneCount || 0;
  const total = params.totalCount || 50;
  const streak = params.streakDays || 0;

  const today = new Date();
  const calendarWeek = useMemo(() => getCalendarWeek(today), []);

  const progressPercent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const xpToNext = level * 500;
  const xpPercent = xpToNext > 0 ? Math.min(100, Math.round((xp / xpToNext) * 100)) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#F6FBFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Challenge</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Greeting + Streak */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingTitle}>Keep Going! 🔥</Text>
            <Text style={styles.greetingSubtitle}>Stay consistent, keep learning</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={18} color="#FF6A45" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>

        {/* New Challenge Banner */}
        <LinearGradient
          colors={['rgba(0, 208, 132, 0.15)', 'rgba(0, 184, 107, 0.05)']}
          style={styles.challengeBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.challengeBannerIcon}>
            <Ionicons name="trophy" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeBannerTitle}>AI Coach Challenge</Text>
            <Text style={styles.challengeBannerSubtitle}>Complete all {total} videos to master AI</Text>
          </View>
          <View style={styles.startBadge}>
            <Text style={styles.startBadgeText}>Lv {level}</Text>
          </View>
        </LinearGradient>

        {/* Calendar Week */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarRow}>
            {calendarWeek.map((day, idx) => (
              <View key={idx} style={styles.calendarDay}>
                <Text style={[styles.calendarDayName, day.isToday && styles.calendarDayNameActive]}>
                  {day.dayName}
                </Text>
                <View style={[styles.calendarDayCircle, day.isToday && styles.calendarDayCircleActive]}>
                  <Text style={[styles.calendarDayNum, day.isToday && styles.calendarDayNumActive]}>
                    {day.dayNum}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* XP Card */}
          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(0, 208, 132, 0.12)' }]}>
                <Ionicons name="flash" size={20} color="#00D084" />
              </View>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <Text style={styles.statValue}>{xp}</Text>
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBar, { width: `${xpPercent}%`, backgroundColor: '#00D084' }]} />
            </View>
            <Text style={styles.statMeta}>{xp} / {xpToNext} XP to Level {level + 1}</Text>
          </View>

          {/* Level Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(246, 196, 83, 0.12)' }]}>
              <Ionicons name="star" size={20} color="#F6C453" />
            </View>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>

          {/* Streak Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255, 106, 69, 0.12)' }]}>
              <Ionicons name="flame" size={20} color="#FF6A45" />
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          {/* Completed Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(0, 208, 132, 0.12)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#00D084" />
            </View>
            <Text style={styles.statValue}>{done}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* Remaining Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(161, 178, 204, 0.12)' }]}>
              <Ionicons name="time-outline" size={20} color="#A1B2CC" />
            </View>
            <Text style={styles.statValue}>{total - done}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Completion Overview */}
        <View style={styles.completionSection}>
          <Text style={styles.sectionTitle}>Completion Overview</Text>
          <View style={styles.completionCard}>
            <View style={styles.completionRow}>
              <Text style={styles.completionLabel}>Videos Completed</Text>
              <Text style={styles.completionValue}>{done} / {total}</Text>
            </View>
            <View style={styles.completionProgressWrap}>
              <View style={[styles.completionProgress, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.completionPercent}>{progressPercent}% complete</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {done > 0 ? (
            <>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: 'rgba(0, 208, 132, 0.12)' }]}>
                  <Ionicons name="videocam" size={18} color="#00D084" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Video Completed</Text>
                  <Text style={styles.activityMeta}>Today</Text>
                </View>
                <Text style={styles.activityXp}>+{Math.round(xp / Math.max(done, 1))} XP</Text>
              </View>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: 'rgba(246, 196, 83, 0.12)' }]}>
                  <Ionicons name="trophy" size={18} color="#F6C453" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Level {level} Reached</Text>
                  <Text style={styles.activityMeta}>Keep it up!</Text>
                </View>
                <Text style={styles.activityXp}>{xp} XP</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="hourglass-outline" size={32} color="#3A4D63" />
              <Text style={styles.emptyActivityText}>No activity yet. Complete a video to get started!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F6FBFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F6FBFF',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#7A8FA6',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 106, 69, 0.12)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 69, 0.2)',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6A45',
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.12)',
  },
  challengeBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 208, 132, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  challengeBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F6FBFF',
    marginBottom: 2,
  },
  challengeBannerSubtitle: {
    fontSize: 13,
    color: '#7A8FA6',
  },
  startBadge: {
    backgroundColor: '#00D084',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  startBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#041610',
  },
  calendarSection: {
    marginBottom: SPACING.lg,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
    gap: 8,
  },
  calendarDayName: {
    fontSize: 12,
    color: '#5F7188',
    fontWeight: '500',
  },
  calendarDayNameActive: {
    color: '#00D084',
  },
  calendarDayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#1F3348',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCircleActive: {
    backgroundColor: '#00D084',
    borderColor: '#00D084',
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1B2CC',
  },
  calendarDayNumActive: {
    color: '#041610',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#131A22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: 8,
  },
  statCardWide: {
    minWidth: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F6FBFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#7A8FA6',
    fontWeight: '500',
  },
  statMeta: {
    fontSize: 12,
    color: '#5F7188',
    marginTop: 4,
  },
  progressBarWrap: {
    width: '100%',
    height: 6,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  completionSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F6FBFF',
    marginBottom: 14,
  },
  completionCard: {
    backgroundColor: '#131A22',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionLabel: {
    fontSize: 14,
    color: '#A1B2CC',
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F6FBFF',
  },
  completionProgressWrap: {
    width: '100%',
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  completionProgress: {
    height: '100%',
    backgroundColor: '#00D084',
    borderRadius: 4,
  },
  completionPercent: {
    fontSize: 12,
    color: '#00D084',
    fontWeight: '600',
  },
  activitySection: {
    marginBottom: SPACING.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131A22',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F6FBFF',
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 12,
    color: '#5F7188',
  },
  activityXp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D084',
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
    backgroundColor: '#131A22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#5F7188',
    textAlign: 'center',
  },
});
