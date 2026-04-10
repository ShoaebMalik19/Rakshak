import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import SOSButton from '@/components/SOSButton';
import SOSModal from '@/components/SOSModal';
import HelplineBar from '@/components/HelplineBar';
import Toast from '@/components/Toast';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const quickActions = [
  { icon: 'map' as const, label: 'Safe Route', route: '/(tabs)/map' as const, color: '#3A7D44', bg: '#3A7D4415' },
  { icon: 'navigation' as const, label: 'Journey Watch', route: '/(tabs)/journey' as const, color: '#B07D3A', bg: '#B07D3A15' },
  { icon: 'phone' as const, label: 'Fake Call', route: '/(tabs)/detect' as const, color: '#C0445A', bg: '#C0445A15' },
  { icon: 'camera' as const, label: 'Cam Scan', route: '/(tabs)/detect' as const, color: '#4A90D9', bg: '#4A90D915' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, contacts, activities, totalSOS, journeysCompleted, triggerSOS } = useApp();
  const [sosVisible, setSOSVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleSOSTrigger = () => setSOSVisible(true);
  const handleSOSCancel = () => setSOSVisible(false);
  const handleSOSComplete = () => {
    setSOSVisible(false);
    triggerSOS();
    setToastMsg('SOS Alert sent to your contacts!');
    setToastVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SOSModal visible={sosVisible} onCancel={handleSOSCancel} onComplete={handleSOSComplete} />
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeIn }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad + 120 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Feather name="bell" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Feather name="grid" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SOS Card */}
        <View style={[styles.sosCard, { backgroundColor: colors.card }]}>
          <View style={styles.sosCenter}>
            <SOSButton onSOSTriggered={handleSOSTrigger} />
          </View>
          <View style={[styles.sosHintRow, { backgroundColor: colors.primary + '08' }]}>
            <Feather name="alert-circle" size={13} color={colors.primary} />
            <Text style={[styles.sosHint, { color: colors.mutedForeground }]}>
              Hold button for 1.5 seconds to trigger SOS
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(action.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{action.label}</Text>
              <Feather name="chevron-right" size={14} color={colors.border} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Contacts', value: contacts.length, icon: 'users' as const, color: '#4A90D9' },
            { label: 'Journeys', value: journeysCompleted, icon: 'navigation' as const, color: '#3A7D44' },
            { label: 'SOS Sent', value: totalSOS, icon: 'alert-circle' as const, color: '#C0445A' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Feather name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
          {activities.slice(0, 5).map((activity, i) => (
            <View key={activity.id} style={[
              styles.activityRow,
              i < Math.min(activities.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={activity.icon as any} size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityText, { color: colors.foreground }]}>{activity.text}</Text>
                <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Motivational banner */}
        <View style={[styles.motiveBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.motiveText, { color: colors.foreground }]}>
            Stay alert. You are never alone.
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Helpline bar, above tab bar */}
      <View style={{ position: 'absolute', bottom: bottomPad + 60, left: 0, right: 0 }}>
        <HelplineBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sosCard: {
    borderRadius: 24, padding: 28, marginBottom: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  sosCenter: { alignItems: 'center', marginBottom: 20 },
  sosHintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  sosHint: { fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: {
    width: '47.5%', padding: 16, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, padding: 14, borderRadius: 16, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  activityCard: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  activityIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityText: { fontSize: 14, fontWeight: '500' },
  activityTime: { fontSize: 11, marginTop: 2 },
  motiveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8,
  },
  motiveText: { fontSize: 14, fontWeight: '600', flex: 1 },
});
