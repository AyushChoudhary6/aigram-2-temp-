import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BusinessDashboardProps {
  onNavigateToSection?: (section: string, data?: any) => void;
}

type StatCard = {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
};

type SuggestionItem = {
  id: string;
  title: string;
  subtitle: string;
  saving: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  active?: boolean;
};

const stats: StatCard[] = [
  {
    id: 'time',
    title: 'Time Saved',
    value: '0h',
    subtitle: 'with AI automation',
    icon: 'time-outline',
    gradientFrom: '#133A32',
    gradientTo: '#0E1824',
    iconColor: '#16D9A1',
  },
  {
    id: 'automation',
    title: 'Automation',
    value: '40%',
    subtitle: 'efficiency score',
    icon: 'trending-up-outline',
    gradientFrom: '#1A4B2F',
    gradientTo: '#0E1824',
    iconColor: '#13D69F',
  },
  {
    id: 'streak',
    title: 'Streak',
    value: '7',
    subtitle: 'days learning',
    icon: 'calendar-outline',
    gradientFrom: '#3C3217',
    gradientTo: '#1A1820',
    iconColor: '#F5C04D',
  },
  {
    id: 'completed',
    title: 'Completed',
    value: '0',
    subtitle: 'tasks done',
    icon: 'checkmark-circle-outline',
    gradientFrom: '#3B2558',
    gradientTo: '#1A1829',
    iconColor: '#B86DFF',
  },
];

const weekDays = [
  { day: 'Mon', value: 1 },
  { day: 'Tue', value: 1 },
  { day: 'Wed', value: 1 },
  { day: 'Thu', value: 1 },
  { day: 'Fri', value: 1 },
  { day: 'Sat', value: 1 },
  { day: 'Sun', value: 0.02 },
];

const suggestions: SuggestionItem[] = [
  {
    id: 'support',
    title: 'Automate Customer Support',
    subtitle: 'Use AI chatbots to handle 70% of inquiries',
    saving: 'Save 15 hrs/week',
    icon: 'flash-outline',
    accent: '#00D9A2',
    active: true,
  },
  {
    id: 'content',
    title: 'Content Generation Pipeline',
    subtitle: 'Auto-generate social posts from your blog',
    saving: 'Save 8 hrs/week',
    icon: 'construct-outline',
    accent: '#E0A700',
  },
  {
    id: 'leads',
    title: 'Lead Scoring with AI',
    subtitle: 'Prioritize hot leads automatically',
    saving: 'Save 5 hrs/week',
    icon: 'radio-button-on-outline',
    accent: '#E0A700',
  },
  {
    id: 'email',
    title: 'Email Personalization',
    subtitle: 'AI-crafted emails for each segment',
    saving: 'Save 4 hrs/week',
    icon: 'star-outline',
    accent: '#A1B8B7',
  },
];

const automationBars = [
  { label: 'Customer Service', value: 70 },
  { label: 'Content Creation', value: 85 },
  { label: 'Sales Outreach', value: 60 },
];

export default function BusinessDashboard(_: BusinessDashboardProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        {stats.map((item) => (
          <View
            key={item.id}
            style={[
              styles.statCard,
              {
                borderColor: `${item.iconColor}55`,
                backgroundColor: item.gradientTo,
              },
            ]}
          >
            <View style={[styles.statCardGlow, { backgroundColor: item.gradientFrom }]} />
            <View style={styles.statTopRow}>
              <Ionicons name={item.icon} size={18} color={item.iconColor} />
              <Text style={styles.statTitle}>{item.title}</Text>
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statSubtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="bar-chart-outline" size={18} color="#00D9A2" />
            <Text style={styles.panelTitle}>Your Progress</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>0/10 Programs</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
        <Text style={styles.progressHint}>0% complete • Keep going!</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
            <Ionicons name="calendar-outline" size={18} color="#00D9A2" />
          <Text style={styles.panelTitle}>This Week&apos;s Activity</Text>
        </View>
        <View style={styles.weekChartRow}>
          {weekDays.map((day) => (
            <View key={day.day} style={styles.weekCol}>
              <View style={styles.weekTrack}>
                <View style={[styles.weekFill, { width: `${Math.max(day.value * 100, 1)}%` }]} />
              </View>
              <Text style={styles.weekLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.suggestionHeading}>
        <Ionicons name="bulb-outline" size={16} color="#F6C744" />
        <Text style={styles.suggestionHeadingText}>AI Suggestions to Save More Time</Text>
      </View>

      {suggestions.map((item) => (
        <View key={item.id} style={styles.suggestionCard}>
          <View style={styles.suggestionLeft}>
            <View style={[styles.suggestionIconWrap, { backgroundColor: `${item.accent}22` }]}>
              <Ionicons name={item.icon} size={20} color={item.accent} />
            </View>
            <View>
              <Text style={styles.suggestionTitle}>{item.title}</Text>
              <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <View style={[styles.savingBadge, item.active && styles.savingBadgeActive]}>
            <Text style={[styles.savingBadgeText, item.active && styles.savingBadgeTextActive]}>{item.saving}</Text>
          </View>
        </View>
      ))}

      <View style={styles.automationCard}>
        <View style={styles.panelTitleRow}>
          <View style={styles.automationIconWrap}>
            <Ionicons name="flash-outline" size={20} color="#00D9A2" />
          </View>
          <View>
            <Text style={styles.panelTitle}>Automation Potential</Text>
            <Text style={styles.automationSubtitle}>Based on your business type</Text>
          </View>
        </View>

        {automationBars.map((item) => (
          <View key={item.label} style={styles.automationRow}>
            <View style={styles.automationLabelRow}>
              <Text style={styles.automationLabel}>{item.label}</Text>
              <Text style={styles.automationValue}>{item.value}%</Text>
            </View>
            <View style={styles.automationTrack}>
              <View style={[styles.automationFill, { width: `${item.value}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomGap} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B14',
  },
  content: {
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 8,
  },
  statCard: {
    width: '49%',
    minHeight: 108,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  statCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#9FB8BE',
  },
  statValue: {
    marginTop: 6,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '800',
    color: '#F7FAFF',
  },
  statSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#9FB8BE',
  },
  panel: {
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 233, 244, 0.7)',
    backgroundColor: '#101722',
    padding: 12,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: '#F7FAFF',
    fontWeight: '700',
  },
  progressBadge: {
    backgroundColor: '#172131',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressBadgeText: {
    color: '#F8FDFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#1A2435',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1FD4A0',
  },
  progressHint: {
    marginTop: 8,
    fontSize: 16,
    color: '#9AB5B9',
  },
  weekChartRow: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 8,
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekTrack: {
    width: '100%',
    height: 9,
    borderRadius: 8,
    backgroundColor: '#1A2435',
    overflow: 'hidden',
  },
  weekFill: {
    height: '100%',
    backgroundColor: '#20D4A1',
  },
  weekLabel: {
    marginTop: 8,
    color: '#A2BCC1',
    fontSize: 14,
  },
  suggestionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
    marginTop: 2,
    marginBottom: 2,
  },
  suggestionHeadingText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: '#F8FCFF',
  },
  suggestionCard: {
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 233, 244, 0.8)',
    backgroundColor: '#101722',
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  suggestionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    fontSize: 16,
    color: '#F7FBFF',
    fontWeight: '700',
  },
  suggestionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#9AB5B9',
  },
  savingBadge: {
    borderWidth: 1,
    borderColor: '#DEE8F8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savingBadgeActive: {
    backgroundColor: '#1CD29E',
    borderColor: '#1CD29E',
  },
  savingBadgeText: {
    color: '#F7FBFF',
    fontWeight: '700',
    fontSize: 13,
  },
  savingBadgeTextActive: {
    color: '#041613',
  },
  automationCard: {
    marginHorizontal: 8,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(21, 212, 161, 0.45)',
    backgroundColor: '#101722',
    padding: 12,
  },
  automationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 217, 165, 0.14)',
  },
  automationSubtitle: {
    marginTop: 2,
    color: '#9AB5B9',
    fontSize: 12,
  },
  automationRow: {
    marginTop: 12,
  },
  automationLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  automationLabel: {
    color: '#B1C3C8',
    fontSize: 13,
  },
  automationValue: {
    color: '#F7FBFF',
    fontSize: 15,
    fontWeight: '700',
  },
  automationTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1A2435',
    overflow: 'hidden',
  },
  automationFill: {
    height: '100%',
    backgroundColor: '#1ED3A0',
  },
  bottomGap: {
    height: 14,
  },
});


