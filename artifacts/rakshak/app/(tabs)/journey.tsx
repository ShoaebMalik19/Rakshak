import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function JourneyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { journeys, activeJourney, startJourney, endJourney, contacts } = useApp();
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (!activeJourney) return;
    const targetMs = new Date(`1970-01-01T${activeJourney.expectedArrival}:00`).getTime();
    const startMs = new Date(`1970-01-01T${new Date().getHours()}:${new Date().getMinutes()}:00`).getTime();
    const diffSec = Math.max(0, Math.floor((targetMs - startMs) / 1000));
    setTimeLeft(diffSec > 0 ? diffSec : 300);
  }, [activeJourney]);

  useEffect(() => {
    if (!activeJourney || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) {
          clearInterval(t);
          setAlertVisible(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activeJourney, timeLeft]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!destination.trim() || !arrivalTime.trim()) return;
    const journey = {
      id: Date.now().toString(),
      destination: destination.trim(),
      expectedArrival: arrivalTime.trim(),
      startTime: Date.now(),
      status: 'active' as const,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    startJourney(journey);
    setDestination('');
    setArrivalTime('');
  };

  const handleSafeArrival = () => {
    if (activeJourney) endJourney(activeJourney.id, 'safe');
  };

  const statusColor = (s: string) => {
    if (s === 'safe') return colors.safe;
    if (s === 'alerted') return colors.primary;
    return colors.accent;
  };

  const statusIcon = (s: string) => {
    if (s === 'safe') return 'check-circle' as const;
    if (s === 'alerted') return 'alert-circle' as const;
    return 'clock' as const;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad + 90 }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Journey Watch</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Track your journey. Your contacts are alerted if you don't arrive safely.
        </Text>

        {/* Active journey */}
        {activeJourney ? (
          <View style={[styles.activeCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
            <View style={styles.activeHeader}>
              <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.activeLabel, { color: colors.primary }]}>Journey Active</Text>
            </View>
            <Text style={[styles.activeDest, { color: colors.foreground }]}>{activeJourney.destination}</Text>
            <Text style={[styles.activeEta, { color: colors.mutedForeground }]}>
              Expected arrival: {activeJourney.expectedArrival}
            </Text>

            <View style={[styles.timerBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.timerValue, { color: timeLeft < 60 ? colors.primary : colors.foreground }]}>
                {fmt(timeLeft)}
              </Text>
              <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>remaining</Text>
            </View>

            <Text style={[styles.alertingText, { color: colors.mutedForeground }]}>
              Alerting: {contacts.filter(c => c.isPrimary).map(c => c.name).join(', ') || 'Amma'}
            </Text>

            <TouchableOpacity
              style={[styles.safeBtn, { backgroundColor: colors.safe }]}
              onPress={handleSafeArrival}
            >
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.safeBtnText}>I Arrived Safely</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Start a Journey</Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Destination</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                color: colors.foreground,
              }]}
              placeholder="Where are you going?"
              placeholderTextColor={colors.mutedForeground}
              value={destination}
              onChangeText={setDestination}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Expected Arrival Time</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                color: colors.foreground,
              }]}
              placeholder="HH:MM (e.g. 21:30)"
              placeholderTextColor={colors.mutedForeground}
              value={arrivalTime}
              onChangeText={setArrivalTime}
              keyboardType="numbers-and-punctuation"
            />

            <TouchableOpacity
              style={[styles.startBtn, {
                backgroundColor: destination && arrivalTime ? colors.primary : colors.muted,
              }]}
              onPress={handleStart}
              disabled={!destination || !arrivalTime}
            >
              <Feather name="navigation" size={18} color={destination && arrivalTime ? '#fff' : colors.mutedForeground} />
              <Text style={[styles.startText, { color: destination && arrivalTime ? '#fff' : colors.mutedForeground }]}>
                Start Journey
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Journey History</Text>
        {journeys.filter(j => j.status !== 'active').map(j => (
          <View key={j.id} style={[styles.historyCard, { backgroundColor: colors.card }]}>
            <View style={[styles.historyIcon, { backgroundColor: statusColor(j.status) + '20' }]}>
              <Feather name={statusIcon(j.status)} size={18} color={statusColor(j.status)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyDest, { color: colors.foreground }]}>{j.destination}</Text>
              <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>{j.date} · {j.expectedArrival}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(j.status) + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor(j.status) }]}>
                {j.status === 'safe' ? 'Safe' : j.status === 'alerted' ? 'Alerted' : 'Active'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Auto-alert Modal */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertModal, { backgroundColor: colors.card }]}>
            <View style={[styles.alertIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="alert-circle" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Auto-Alerting Contacts</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
              You haven't arrived at your destination. Sending alert to your trusted contacts...
            </Text>
            <TouchableOpacity
              style={[styles.alertClose, { backgroundColor: colors.primary }]}
              onPress={() => {
                setAlertVisible(false);
                if (activeJourney) endJourney(activeJourney.id, 'alerted');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>I'm Safe — Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  formCard: {
    borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    height: 50, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, fontSize: 15, marginBottom: 14,
  },
  startBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  startText: { fontSize: 16, fontWeight: '700' },
  activeCard: {
    borderRadius: 20, padding: 20, borderWidth: 2, marginBottom: 24,
  },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  activeDest: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  activeEta: { fontSize: 14, marginBottom: 20 },
  timerBox: {
    borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  timerValue: { fontSize: 52, fontWeight: '800', letterSpacing: -2 },
  timerLabel: { fontSize: 13, marginTop: 4 },
  alertingText: { fontSize: 13, marginBottom: 16, textAlign: 'center' },
  safeBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3A7D44', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  safeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  historyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyDest: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  historyDate: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  alertOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  alertModal: {
    width: 300, padding: 32, borderRadius: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 20,
  },
  alertIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  alertTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  alertDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  alertClose: {
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 24,
  },
});
