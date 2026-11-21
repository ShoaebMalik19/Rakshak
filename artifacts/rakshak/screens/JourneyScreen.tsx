import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Platform, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useApp, uid } from '../context/AppContext';
import SOSModal from '../components/SOSModal';
import Toast from '../components/Toast';

/** How long the overdue check-in waits for "I'm safe" before opening SOS. */
const GRACE_SECONDS = 60;

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
];

/** Parses "21:30" / "9:05" into the next occurrence of that time (today or tomorrow). */
function parseArrival(text: string): Date | null {
  const m = text.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function JourneyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { journeys, activeJourney, startJourney, endJourney, extendJourney, contacts, recordSOS } = useApp();
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [graceLeft, setGraceLeft] = useState(GRACE_SECONDS);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [sosVisible, setSOSVisible] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'warning' } | null>(null);

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 0 : insets.bottom;

  // Tick from wall-clock time, so the countdown stays correct even if timers were throttled.
  useEffect(() => {
    if (!activeJourney) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeJourney?.id]);

  const timeLeft = activeJourney ? Math.max(0, Math.ceil((activeJourney.deadline - now) / 1000)) : 0;
  const overdue = !!activeJourney && timeLeft === 0;

  useEffect(() => {
    if (overdue && !checkInVisible && !sosVisible) {
      setGraceLeft(GRACE_SECONDS);
      setCheckInVisible(true);
      if (Platform.OS !== 'web') Vibration.vibrate([0, 500, 300, 500, 300, 500]);
    }
  }, [overdue]);

  useEffect(() => {
    if (!checkInVisible) return;
    if (graceLeft <= 0) { openSOS(); return; }
    const t = setTimeout(() => setGraceLeft(g => g - 1), 1000);
    return () => clearTimeout(t);
  }, [checkInVisible, graceLeft]);

  const begin = (deadline: Date) => {
    if (!destination.trim()) { setError('Where are you going?'); return; }
    setError('');
    startJourney({
      id: uid(),
      destination: destination.trim(),
      expectedArrival: hhmm(deadline),
      startTime: Date.now(),
      deadline: deadline.getTime(),
      status: 'active',
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    setDestination('');
    setArrivalTime('');
  };

  const handleStart = () => {
    const d = parseArrival(arrivalTime);
    if (!d) { setError('Enter arrival time as HH:MM, for example 21:30, or pick a preset.'); return; }
    begin(d);
  };

  const handleSafeArrival = () => {
    setCheckInVisible(false);
    if (activeJourney) endJourney(activeJourney.id, 'safe');
    setToast({ msg: 'Marked safe. Journey complete.', tone: 'success' });
  };

  const handleExtend = (m: number) => {
    extendJourney(m);
    setCheckInVisible(false);
  };

  function openSOS() {
    setCheckInVisible(false);
    setSOSVisible(true);
  }

  const statusColor = (s: string) => (s === 'safe' ? colors.safe : s === 'alerted' ? colors.primary : colors.accent);
  const statusIcon = (s: string): 'checkmark-circle' | 'alert-circle' | 'time' =>
    s === 'safe' ? 'checkmark-circle' : s === 'alerted' ? 'alert-circle' : 'time';

  const history = (journeys || []).filter(j => j.status !== 'active');
  const alertNames = contacts.map(c => c.name);
  const canStart = destination.trim().length > 0;
  const totalSecs = activeJourney ? Math.max(1, Math.round((activeJourney.deadline - activeJourney.startTime) / 1000)) : 1;
  const progress = activeJourney ? Math.min(1, 1 - timeLeft / totalSecs) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast message={toast?.msg ?? ''} tone={toast?.tone} visible={!!toast} onHide={() => setToast(null)} />
      <SOSModal
        visible={sosVisible}
        countdownFrom={0}
        reason={activeJourney ? `Journey to ${activeJourney.destination} is overdue` : undefined}
        onCancel={() => setSOSVisible(false)}
        onComplete={(summary) => {
          setSOSVisible(false);
          recordSOS(summary);
          if (activeJourney) endJourney(activeJourney.id, 'alerted');
          setToast({ msg: summary, tone: summary.startsWith('SOS sent') ? 'success' : 'warning' });
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Journey Watch</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Set when you expect to arrive. If you don't check in by then, Rakshak asks if you're safe and opens SOS after {GRACE_SECONDS} seconds.
        </Text>

        {activeJourney ? (
          <View style={[styles.activeCard, { backgroundColor: colors.primary + '10', borderColor: overdue ? colors.primary : colors.primary + '55' }]}>
            <View style={styles.activeHeader}>
              <View style={[styles.activeDot, { backgroundColor: overdue ? colors.primary : colors.safe }]} />
              <Text style={[styles.activeLabel, { color: overdue ? colors.primary : colors.safe }]}>
                {overdue ? 'OVERDUE' : 'JOURNEY ACTIVE'}
              </Text>
            </View>
            <Text style={[styles.activeDest, { color: colors.foreground }]}>{activeJourney.destination}</Text>
            <Text style={[styles.activeEta, { color: colors.mutedForeground }]}>
              Check in by {activeJourney.expectedArrival}
            </Text>
            <View style={[styles.timerBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.timerValue, { color: timeLeft < 60 ? colors.primary : colors.foreground }]}>
                {fmt(timeLeft)}
              </Text>
              <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>remaining</Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: timeLeft < 60 ? colors.primary : colors.safe }]} />
              </View>
            </View>
            <Text style={[styles.alertingText, { color: colors.mutedForeground }]}>
              {alertNames.length > 0
                ? `If you don't check in, SOS will be prepared for ${alertNames.join(', ')}`
                : 'No emergency contacts yet. Add one in Profile so SOS can reach someone.'}
            </Text>
            <TouchableOpacity style={[styles.safeBtn, { backgroundColor: colors.safe }]} onPress={handleSafeArrival}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.safeBtnText}>I Arrived Safely</Text>
            </TouchableOpacity>
            <View style={styles.secondaryRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => handleExtend(15)}>
                <Ionicons name="add-circle-outline" size={16} color={colors.foreground} />
                <Text style={[styles.secondaryText, { color: colors.foreground }]}>15 min</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={openSOS}>
                <Ionicons name="alert-circle" size={16} color={colors.primary} />
                <Text style={[styles.secondaryText, { color: colors.primary }]}>SOS now</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' && (
              <Text style={[styles.webNote, { color: colors.mutedForeground }]}>
                Web preview: keep this tab open. The timer can't alert you while the browser is closed.
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Start a Journey</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Destination</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Where are you going?"
              placeholderTextColor={colors.mutedForeground}
              value={destination}
              onChangeText={t => { setDestination(t); setError(''); }}
            />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Arrive within</Text>
            <View style={styles.presetRow}>
              {PRESETS.map(p => (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.preset, { borderColor: colors.primary, opacity: canStart ? 1 : 0.5 }]}
                  onPress={() => begin(new Date(Date.now() + p.minutes * 60_000))}
                >
                  <Text style={[styles.presetText, { color: colors.primary }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Or expected arrival time</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="HH:MM (e.g. 21:30)"
              placeholderTextColor={colors.mutedForeground}
              value={arrivalTime}
              onChangeText={t => { setArrivalTime(t); setError(''); }}
              onSubmitEditing={handleStart}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            {!!error && <Text style={[styles.error, { color: colors.primary }]}>{error}</Text>}
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: canStart && arrivalTime ? colors.primary : colors.muted }]}
              onPress={handleStart}
              disabled={!canStart || !arrivalTime}
            >
              <Ionicons name="navigate" size={18} color={canStart && arrivalTime ? '#fff' : colors.mutedForeground} />
              <Text style={[styles.startText, { color: canStart && arrivalTime ? '#fff' : colors.mutedForeground }]}>
                Start Journey
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Journey History</Text>
        {history.map(j => (
          <View key={j.id} style={[styles.historyCard, { backgroundColor: colors.card }]}>
            <View style={[styles.historyIcon, { backgroundColor: statusColor(j.status) + '20' }]}>
              <Ionicons name={statusIcon(j.status)} size={18} color={statusColor(j.status)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyDest, { color: colors.foreground }]}>{j.destination}</Text>
              <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>{j.date} · due {j.expectedArrival}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(j.status) + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor(j.status) }]}>
                {j.status === 'safe' ? 'Safe' : 'SOS opened'}
              </Text>
            </View>
          </View>
        ))}
        {history.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No completed journeys yet.</Text>
        )}
      </ScrollView>

      <Modal visible={checkInVisible} transparent animationType="fade" onRequestClose={handleSafeArrival}>
        <View style={styles.alertOverlay}>
          <View style={[styles.alertModal, { backgroundColor: colors.card }]}>
            <View style={[styles.alertIcon, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.graceText, { color: colors.primary }]}>{graceLeft}</Text>
            </View>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Are you safe?</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
              You haven't checked in for {activeJourney?.destination ?? 'your journey'}. SOS opens in {graceLeft}s unless you respond.
            </Text>
            <TouchableOpacity style={[styles.alertBtn, { backgroundColor: colors.safe }]} onPress={handleSafeArrival}>
              <Text style={styles.alertBtnText}>I'm safe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.alertBtn, { backgroundColor: colors.secondary }]} onPress={() => handleExtend(15)}>
              <Text style={[styles.alertBtnText, { color: colors.foreground }]}>Need 15 more minutes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.alertBtn, { backgroundColor: colors.primary }]} onPress={openSOS}>
              <Text style={styles.alertBtnText}>Send SOS now</Text>
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
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 16 },
  formCard: {
    borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    height: 50, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, fontSize: 15, marginBottom: 14,
  },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  preset: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  presetText: { fontSize: 14, fontWeight: '700' },
  error: { fontSize: 13, marginTop: -6, marginBottom: 12, fontWeight: '600' },
  startBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  startText: { fontSize: 16, fontWeight: '700' },
  activeCard: { borderRadius: 20, padding: 20, borderWidth: 2, marginBottom: 24 },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  activeDest: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  activeEta: { fontSize: 14, marginBottom: 20 },
  timerBox: {
    borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  timerValue: { fontSize: 52, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  progressTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  alertingText: { fontSize: 13, marginBottom: 16, textAlign: 'center', lineHeight: 18 },
  safeBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  safeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  webNote: { fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  historyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyDest: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  historyDate: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(28,22,18,0.7)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  alertModal: {
    width: '100%', maxWidth: 340, padding: 28, borderRadius: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 20,
  },
  alertIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  graceText: { fontSize: 32, fontWeight: '800' },
  alertTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  alertDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtn: { width: '100%', paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginBottom: 10 },
  alertBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
