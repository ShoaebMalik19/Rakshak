import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform
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
  { icon: 'map' as const, label: 'Safe Route', route: '/(tabs)/map' as const, color: '#3A7D44' },
  { icon: 'navigation' as const, label: 'Journey Watch', route: '/(tabs)/journey' as const, color: '#B07D3A' },
  { icon: 'phone' as const, label: 'Fake Call', route: '/(tabs)/detect' as const, color: '#C0445A' },
  { icon: 'camera' as const, label: 'Camera Scan', route: '/(tabs)/detect' as const, color: '#4A90D9' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, contacts, activities, totalSOS, journeysCompleted, incidentsReported, triggerSOS } = useApp();
  const [sosVisible, setSOSVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }]}
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

        {/* SOS Section */}
        <View style={[styles.sosCard, { backgroundColor: colors.card }]}>
          <View style={styles.sosCenter}>
            <SOSButton onSOSTriggered={handleSOSTrigger} />
          </View>
          <Text style={[styles.sosHint, { color: colors.mutedForeground }]}>
            Hold the button for 1.5 seconds to trigger SOS
          </Text>
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
              <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Contacts', value: contacts.length, icon: 'users' as const },
            { label: 'Journeys', value: journeysCompleted, icon: 'navigation' as const },
            { label: 'SOS Sent', value: totalSOS, icon: 'alert-circle' as const },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Feather name={stat.icon} size={18} color={colors.primary} />
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
              i < activities.slice(0, 5).length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
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
      </ScrollView>

      {/* Helplines above bottom nav */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sosCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  sosCenter: { alignItems: 'center', marginBottom: 16 },
  sosHint: { fontSize: 13, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    width: '47%',
    padding: 18,
    borderRadius: 18,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, padding: 14, borderRadius: 16,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  activityCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  activityText: { fontSize: 14, fontWeight: '500' },
  activityTime: { fontSize: 12, marginTop: 2 },
});
