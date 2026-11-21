import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Platform
} from 'react-native';
import { NATIVE_DRIVER } from '../constants/anim';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useApp } from '../context/AppContext';
import SOSModal from '../components/SOSModal';

const callers = [
  { id: 'mom', name: 'Mom', subtitle: 'Primary Contact', bg: '#FCE4EC', color: '#C0445A', initial: 'M' },
  { id: 'office', name: 'Office', subtitle: 'Work Contact', bg: '#E3F2FD', color: '#1565C0', initial: 'O' },
  { id: 'doctor', name: 'Dr. Sharma', subtitle: 'Doctor', bg: '#E8F5E9', color: '#3A7D44', initial: 'D' },
];

const CHECKLIST = [
  { id: 'lens', title: 'Flashlight sweep for lens glints', desc: 'Lights off, shine your phone torch slowly across the room. Camera lenses reflect a small bright dot.' },
  { id: 'ir', title: 'Look for infrared LEDs', desc: 'In the dark, view the room through your front camera. Night-vision LEDs can show up as purple or white dots.' },
  { id: 'smoke', title: 'Smoke detectors and air fresheners', desc: 'Check for tiny holes or lenses, especially ones facing the bed or shower.' },
  { id: 'chargers', title: 'USB chargers, clocks and adapters', desc: 'Unfamiliar chargers or clocks plugged in near the bed are common hiding spots.' },
  { id: 'mirror', title: 'Two-way mirror test', desc: 'Touch a fingernail to the mirror. No gap between nail and reflection can mean a two-way mirror.' },
  { id: 'wifi', title: 'Unknown Wi-Fi devices', desc: 'Look at nearby Wi-Fi network names for camera brands, or use a network scanner app.' },
  { id: 'vents', title: 'Vents, decor and shelves', desc: 'Check vents, plant pots, picture frames and shelves facing private areas.' },
];

const delays = [
  { label: 'Now', seconds: 0 },
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
];

export default function DetectScreen({ navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logActivity, recordSOS } = useApp();

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 0 : insets.bottom;

  const [checked, setChecked] = useState<string[]>([]);
  const [selectedCaller, setSelectedCaller] = useState(callers[0]);
  const [selectedDelay, setSelectedDelay] = useState(delays[0]);
  const [countdown, setCountdown] = useState(0);

  const [sosVisible, setSOSVisible] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'distress' | 'fakecall'>('fakecall');

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length === CHECKLIST.length && prev.length !== CHECKLIST.length) {
        logActivity('Room checked for hidden cameras', 'camera');
      }
      return next;
    });
  };

  const ring = () => {
    logActivity(`Fake call from ${selectedCaller.name}`, 'phone');
    navigation.navigate('IncomingCall', {
      name: selectedCaller.name,
    });
  };

  const cancelScheduled = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(0);
  };

  const triggerFakeCall = () => {
    if (countdown > 0) return cancelScheduled();
    if (selectedDelay.seconds === 0) return ring();
    setCountdown(selectedDelay.seconds);
    const endsAt = Date.now() + selectedDelay.seconds * 1000;
    countdownRef.current = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        cancelScheduled();
        ring();
      } else {
        setCountdown(left);
      }
    }, 250);
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SOSModal
        visible={sosVisible}
        onCancel={() => setSOSVisible(false)}
        onComplete={(summary) => { setSOSVisible(false); recordSOS(summary); }}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Tools</Text>
      </View>

      <View style={[styles.tabRow, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
        {[
          { id: 'fakecall', label: 'Fake Call', icon: 'call-outline' as const },
          { id: 'camera', label: 'Cam Check', icon: 'camera-outline' as const },
          { id: 'distress', label: 'Distress', icon: 'mic-outline' as const },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons name={tab.icon} size={14} color={activeTab === tab.id ? '#fff' : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: activeTab === tab.id ? '#fff' : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'camera' && (
          <>
            <View style={[styles.instructCard, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="information-circle" size={16} color={colors.accent} />
              <Text style={[styles.instructText, { color: colors.foreground }]}>
                A phone can't reliably detect hidden cameras on its own, so Rakshak doesn't fake a scan. Use this checklist for a manual sweep of a hotel room, changing room or rental.
              </Text>
            </View>
            <View style={[styles.checkProgress, { backgroundColor: colors.card }]}>
              <Text style={[styles.checkCount, { color: checked.length === CHECKLIST.length ? colors.safe : colors.foreground }]}>
                {checked.length}/{CHECKLIST.length}
              </Text>
              <Text style={[styles.checkCountLabel, { color: colors.mutedForeground }]}>
                {checked.length === CHECKLIST.length ? 'Sweep complete. If anything looked wrong, leave and report it.' : 'checks done'}
              </Text>
            </View>
            {CHECKLIST.map(item => {
              const done = checked.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.checkRow, { backgroundColor: colors.card, borderColor: done ? colors.safe : colors.border }]}
                  onPress={() => toggleCheck(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkBox, { backgroundColor: done ? colors.safe : 'transparent', borderColor: done ? colors.safe : colors.border }]}>
                    {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.checkDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {checked.length > 0 && (
              <TouchableOpacity onPress={() => setChecked([])} style={{ alignSelf: 'center', padding: 10 }}>
                <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Reset checklist</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === 'distress' && (
          <>
            <View style={[styles.distressCard, { backgroundColor: colors.card }]}>
              <View style={styles.distressHeader}>
                <Text style={[styles.distressTitle, { color: colors.foreground }]}>Distress Listener</Text>
                <View style={[styles.soonBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.soonText, { color: colors.accent }]}>COMING SOON</Text>
                </View>
              </View>
              <Text style={[styles.infoText, { color: colors.mutedForeground, marginBottom: 16 }]}>
                The plan: listen for a safe word such as "help me" and start the SOS countdown hands-free.
                This needs on-device speech recognition in a native build, so it is not active in this version.
                Rakshak is not listening to your microphone.
              </Text>
              <TouchableOpacity
                style={[styles.simulateBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                onPress={() => setSOSVisible(true)}
              >
                <Ionicons name="play" size={16} color={colors.primary} />
                <Text style={[styles.simulateText, { color: colors.primary }]}>Test the SOS flow</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'fakecall' && (
          <>
            <View style={[styles.fakeCallHeader, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
              <Text style={[styles.fakeCallTitle, { color: colors.foreground }]}>Fake Call</Text>
              <Text style={[styles.fakeCallSub, { color: colors.mutedForeground }]}>Escape any situation discreetly</Text>
            </View>

            <Text style={[styles.settingLabel, { color: colors.foreground, marginBottom: 12 }]}>Choose Caller</Text>
            <View style={styles.callerCards}>
              {callers.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.callerCard,
                    { backgroundColor: colors.card, borderColor: selectedCaller.id === c.id ? '#C0445A' : colors.border, borderWidth: selectedCaller.id === c.id ? 2 : 1 },
                    selectedCaller.id === c.id && styles.callerCardSelected,
                  ]}
                  onPress={() => setSelectedCaller(c)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.callerAvatar, { backgroundColor: c.bg }]}>
                    <Text style={[styles.callerInitial, { color: c.color }]}>{c.initial}</Text>
                  </View>
                  <Text style={[styles.callerName, { color: colors.foreground }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.settingLabel, { color: colors.foreground, marginBottom: 12, marginTop: 4 }]}>Call Delay</Text>
            <View style={styles.delayRow}>
              {delays.map(d => (
                <TouchableOpacity
                  key={d.label}
                  style={[
                    styles.delayPill,
                    {
                      backgroundColor: selectedDelay.label === d.label ? '#C0445A' : colors.card,
                      borderColor: selectedDelay.label === d.label ? '#C0445A' : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedDelay(d)}
                >
                  <Text style={[styles.delayText, { color: selectedDelay.label === d.label ? '#fff' : colors.foreground }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {countdown > 0 && (
              <View style={[styles.countdownBanner, { backgroundColor: colors.accent + '15' }]}>
                <Text style={[styles.countdownText, { color: colors.accent }]}>Incoming call in {countdown}s...</Text>
              </View>
            )}

            <TouchableOpacity style={styles.triggerBtn} onPress={triggerFakeCall} activeOpacity={0.87}>
              <Ionicons name={countdown > 0 ? 'close' : 'call'} size={20} color="#fff" />
              <Text style={styles.triggerBtnText}>
                {countdown > 0 ? 'Cancel scheduled call' : selectedDelay.seconds ? `Ring me in ${selectedDelay.label}` : 'Ring me now'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <Ionicons name="information-circle" size={18} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.mutedForeground, flex: 1 }]}>The screen shows an incoming call you can answer, giving you a reason to step away. {Platform.OS === 'web' ? 'In the browser it plays a ringtone; on a phone it vibrates.' : 'Your phone vibrates while it rings.'}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  tabRow: {
    flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11, gap: 5 },
  tabText: { fontSize: 12, fontWeight: '600' },
  scroll: { paddingHorizontal: 16 },
  instructCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginBottom: 16 },
  instructText: { flex: 1, fontSize: 13, lineHeight: 18 },
  radarOuter: { width: 200, height: 200, borderRadius: 100, borderWidth: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  radarInner: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  radarSweep: { position: 'absolute', width: 80, height: 80, top: 0, left: 40 },
  sweepLine: { width: 2, height: 80, borderRadius: 1, opacity: 0.8 },
  radarCenter: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  resultCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  resultBanner: { padding: 14, borderRadius: 14, marginBottom: 14 },
  resultTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scanBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 20,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  scanBtnText: { fontSize: 16, fontWeight: '700' },
  histTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  scanRecord: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  scanIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scanLoc: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  scanTime: { fontSize: 11 },
  scanResult: { fontSize: 12, fontWeight: '700' },
  distressCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  distressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  distressTitle: { fontSize: 18, fontWeight: '700' },
  toggle: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center' },
  toggleKnob: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  soundwave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 70, marginVertical: 8 },
  bar: { width: 5, borderRadius: 3 },
  listenStatus: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  settingsCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  settingLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  keywordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  keyword: { fontSize: 15 },
  sensitivityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sensBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  sensText: { fontSize: 13, fontWeight: '600' },
  simulateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 24, borderWidth: 1.5,
  },
  simulateText: { fontSize: 14, fontWeight: '700' },
  infoCard: {
    borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  infoText: { fontSize: 13, lineHeight: 20 },
  checkProgress: { borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
  checkCount: { fontSize: 34, fontWeight: '800' },
  checkCountLabel: { fontSize: 13, marginTop: 2, textAlign: 'center' },
  checkRow: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10, alignItems: 'flex-start' },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  checkDesc: { fontSize: 12, lineHeight: 17 },
  soonBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  soonText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  fakeCallHeader: {
    borderRadius: 18, padding: 18, marginBottom: 18, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  fakeCallTitle: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  fakeCallSub: { fontSize: 13 },
  callerCards: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  callerCard: {
    flex: 1, borderRadius: 16, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  callerCardSelected: { shadowColor: '#C0445A', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  callerAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  callerInitial: { fontSize: 24, fontWeight: '800' },
  callerName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  delayRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  delayPill: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', borderWidth: 1.5 },
  delayText: { fontSize: 13, fontWeight: '600' },
  countdownBanner: { padding: 14, borderRadius: 14, marginBottom: 12, alignItems: 'center' },
  countdownText: { fontSize: 15, fontWeight: '700' },
  triggerBtn: {
    height: 56, borderRadius: 28, backgroundColor: '#C0445A',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  triggerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
