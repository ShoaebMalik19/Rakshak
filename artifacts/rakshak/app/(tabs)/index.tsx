import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
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
  { icon: 'navigate', label: 'Safe Route', route: '/(tabs)/map' as const, color: '#3A7D44', bg: '#E8F5E9', desc: 'Safest path to destination' },
  { icon: 'time', label: 'Journey Watch', route: '/(tabs)/journey' as const, color: '#B07D3A', bg: '#FFF8E1', desc: 'Auto-alert if late' },
  { icon: 'call', label: 'Fake Call', route: '/(tabs)/detect' as const, color: '#C0445A', bg: '#FCE4EC', desc: 'Exit any situation' },
  { icon: 'camera', label: 'Cam Scan', route: '/(tabs)/detect' as const, color: '#1565C0', bg: '#E3F2FD', desc: 'Detect hidden cameras' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, contacts, activities, totalSOS, journeysCompleted, triggerSOS } = useApp();
  const [sosVisible, setSOSVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const isSOSActive = useRef(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Shake to SOS
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Accelerometer.setUpdateInterval(300);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      if (acceleration > 2.8 && !isSOSActive.current) {
        isSOSActive.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setSOSVisible(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleSOSTrigger = () => {
    isSOSActive.current = true;
    setSOSVisible(true);
  };
  const handleSOSCancel = () => {
    isSOSActive.current = false;
    setSOSVisible(false);
  };
  const handleSOSComplete = (message: string) => {
    setSOSVisible(false);
    triggerSOS();
    setToastMsg(message);
    setToastVisible(true);
    setTimeout(() => { isSOSActive.current = false; }, 5000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SOSModal visible={sosVisible} onCancel={handleSOSCancel} onComplete={handleSOSComplete} />
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <View style={[styles.headerFade, { backgroundColor: colors.primary + '10' }]} />
      <Animated.ScrollView showsVerticalScrollIndicator={false} style={{ opacity: fadeIn }} contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad + 120 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
            <View style={styles.titleWrap}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
              <View style={[styles.titleUnderline, { backgroundColor: colors.primary }]} />
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]}><Ionicons name="notifications" size={20} color={colors.foreground} /></TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]}><Ionicons name="settings" size={20} color={colors.foreground} /></TouchableOpacity>
          </View>
        </View>

        <View style={[styles.sosCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <View style={styles.sosCenter}><SOSButton onSOSTriggered={handleSOSTrigger} /></View>
          <View style={[styles.sosHintRow, { backgroundColor: colors.primary + '08' }]}>
            <Ionicons name="alert-circle" size={13} color={colors.primary} />
            <Text style={[styles.sosHint, { color: colors.mutedForeground }]}>Hold for 1.5s to trigger SOS</Text>
          </View>
          {Platform.OS !== 'web' && (
            <Text style={[styles.shakeHint, { color: colors.mutedForeground }]}>Shake violently to trigger SOS</Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={[styles.quickCard, { backgroundColor: colors.card, borderLeftColor: action.color }]} onPress={() => router.push(action.route)} activeOpacity={0.8}>
              <View style={[styles.quickTop, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={36} color={action.color} />
              </View>
              <View style={styles.quickBottom}>
                <Text style={[styles.quickLabel, { color: colors.foreground }]}>{action.label}</Text>
                <Text style={[styles.quickDesc, { color: colors.mutedForeground }]}>{action.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Contacts', value: contacts.length, icon: 'people', color: '#4A90D9' },
            { label: 'Journeys', value: journeysCompleted, icon: 'time', color: '#3A7D44' },
            { label: 'SOS Sent', value: totalSOS, icon: 'alert-circle', color: '#C0445A' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: stat.color }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}><Ionicons name={stat.icon as any} size={16} color={stat.color} /></View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          {activities.slice(0, 5).map((activity, i) => (
            <View key={activity.id} style={[styles.activityRow, i < Math.min(activities.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons
                  name={activity.icon === 'camera' ? 'camera' : activity.icon === 'phone' ? 'call' : activity.icon === 'map' ? 'navigate' : activity.icon === 'check-circle' ? 'checkmark-circle' : 'alert-circle'}
                  size={14} color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityText, { color: colors.foreground }]}>{activity.text}</Text>
                <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.motiveBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
          <Ionicons name="shield" size={18} color={colors.primary} />
          <Text style={[styles.motiveText, { color: colors.foreground }]}>Stay alert. You are never alone.</Text>
        </View>
      </Animated.ScrollView>
      <View style={{ position: 'absolute', bottom: bottomPad + 60, left: 0, right: 0 }}><HelplineBar /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: '500' },
  titleWrap: { alignItems: 'flex-start' },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  titleUnderline: { width: 38, height: 3, borderRadius: 2, marginTop: 4 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sosCard: { borderRadius: 24, padding: 28, marginBottom: 24, alignItems: 'center', borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  sosCenter: { alignItems: 'center', marginBottom: 16 },
  sosHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
  sosHint: { fontSize: 12 },
  shakeHint: { fontSize: 11, textAlign: 'center', opacity: 0.7 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: { width: '47.5%', height: 130, borderRadius: 16, overflow: 'hidden', borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  quickTop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickBottom: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10 },
  quickLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  quickDesc: { fontSize: 11, lineHeight: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 16, alignItems: 'center', gap: 4, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  activityCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  activityIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityText: { fontSize: 14, fontWeight: '500' },
  activityTime: { fontSize: 11, marginTop: 2 },
  motiveBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  motiveText: { fontSize: 14, fontWeight: '600', flex: 1 },
});
