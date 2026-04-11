import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Platform
} from 'react-native';
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

const delays = [
  { label: 'Now', seconds: 0 },
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
];

export default function DetectScreen({ navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scans, addScan, distressListenerOn, setDistressListener, addActivity, triggerSOS } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | 'safe' | 'alert'>(null);
  const radarAnim = useRef(new Animated.Value(0)).current;
  const radarLoop = useRef<Animated.CompositeAnimation | null>(null);

  const [selectedCaller, setSelectedCaller] = useState(callers[0]);
  const [selectedDelay, setSelectedDelay] = useState(delays[0]);
  const [countdown, setCountdown] = useState(0);

  const [sensitivity, setSensitivity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [keyword] = useState('help me');
  const [sosVisible, setSOSVisible] = useState(false);
  const soundwaveAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<'camera' | 'distress' | 'fakecall'>('camera');

  useEffect(() => {
    if (distressListenerOn) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(soundwaveAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(soundwaveAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    soundwaveAnim.setValue(0);
  }, [distressListenerOn]);

  const startScan = () => {
    setScanning(true);
    setScanResult(null);
    radarLoop.current = Animated.loop(
      Animated.timing(radarAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    );
    radarLoop.current.start();
    setTimeout(() => {
      radarLoop.current?.stop();
      radarAnim.setValue(0);
      setScanning(false);
      const result = Math.random() < 0.3 ? 'alert' : 'safe';
      setScanResult(result);
      addScan({
        id: Date.now().toString() + Math.random(),
        location: 'Current Location, Bengaluru',
        result,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      addActivity({
        id: Date.now().toString() + Math.random(),
        text: result === 'alert' ? 'Camera scan — potential threat detected' : 'Camera scan — all clear',
        time: 'Just now',
        icon: 'camera',
      });
    }, 4000);
  };

  const triggerFakeCall = () => {
    if (selectedDelay.seconds === 0) {
      navigation.navigate('IncomingCall', {
        caller: { name: selectedCaller.name, initials: selectedCaller.initial, color: selectedCaller.bg }
      });
    } else {
      setCountdown(selectedDelay.seconds);
      const t = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(t);
            navigation.navigate('IncomingCall', {
              caller: { name: selectedCaller.name, initials: selectedCaller.initial, color: selectedCaller.bg }
            });
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  const radarRotate = radarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const safeScanHistory = (scans || []).slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SOSModal
        visible={sosVisible}
        onCancel={() => setSOSVisible(false)}
        onComplete={() => { setSOSVisible(false); triggerSOS(); }}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Detection Tools</Text>
      </View>

      <View style={[styles.tabRow, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
        {[
          { id: 'camera', label: 'Scanner', icon: 'camera-outline' as const },
          { id: 'distress', label: 'Distress', icon: 'mic-outline' as const },
          { id: 'fakecall', label: 'Fake Call', icon: 'call-outline' as const },
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
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'camera' && (
          <>
            <View style={[styles.instructCard, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="information-circle" size={16} color={colors.accent} />
              <Text style={[styles.instructText, { color: colors.foreground }]}>
                Point your phone around the room slowly while scanning
              </Text>
            </View>
            <View style={[styles.radarOuter, { borderColor: colors.border }]}>
              <View style={[styles.radarInner, { borderColor: colors.border }]}>
                {scanning && (
                  <Animated.View style={[styles.radarSweep, { transform: [{ rotate: radarRotate }] }]}>
                    <View style={[styles.sweepLine, { backgroundColor: colors.safe }]} />
                  </Animated.View>
                )}
                {scanResult === 'safe' && !scanning && (
                  <View style={[styles.resultCircle, { backgroundColor: colors.safe + '20' }]}>
                    <Ionicons name="checkmark-circle" size={36} color={colors.safe} />
                  </View>
                )}
                {scanResult === 'alert' && !scanning && (
                  <View style={[styles.resultCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="warning" size={36} color={colors.primary} />
                  </View>
                )}
                {!scanning && !scanResult && (
                  <View style={[styles.radarCenter, { backgroundColor: colors.safe + '30' }]}>
                    <Ionicons name="wifi" size={28} color={colors.safe} />
                  </View>
                )}
              </View>
            </View>
            {scanResult && (
              <View style={[styles.resultBanner, { backgroundColor: scanResult === 'safe' ? colors.safe + '15' : colors.primary + '15' }]}>
                <Text style={[styles.resultTitle, { color: scanResult === 'safe' ? colors.safe : colors.primary }]}>
                  {scanResult === 'safe' ? 'No hidden cameras detected' : "Potential IR source detected at 2 o'clock position"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: scanning ? colors.muted : colors.primary }]}
              onPress={startScan}
              disabled={scanning}
            >
              <Ionicons name={scanning ? 'reload' : 'search'} size={18} color={scanning ? colors.mutedForeground : '#fff'} />
              <Text style={[styles.scanBtnText, { color: scanning ? colors.mutedForeground : '#fff' }]}>
                {scanning ? 'Scanning...' : 'Start Scan'}
              </Text>
            </TouchableOpacity>
            {safeScanHistory.length > 0 && (
              <>
                <Text style={[styles.histTitle, { color: colors.foreground }]}>Scan History</Text>
                {safeScanHistory.map(scan => (
                  <View key={scan.id} style={[styles.scanRecord, { backgroundColor: colors.card }]}>
                    <View style={[styles.scanIcon, { backgroundColor: scan.result === 'safe' ? colors.safe + '20' : colors.primary + '20' }]}>
                      <Ionicons name={scan.result === 'safe' ? 'checkmark-circle' : 'warning'} size={16} color={scan.result === 'safe' ? colors.safe : colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scanLoc, { color: colors.foreground }]}>{String(scan.location || '')}</Text>
                      <Text style={[styles.scanTime, { color: colors.mutedForeground }]}>{String(scan.timestamp || '')}</Text>
                    </View>
                    <Text style={[styles.scanResult, { color: scan.result === 'safe' ? colors.safe : colors.primary }]}>
                      {scan.result === 'safe' ? 'Clear' : 'Alert'}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'distress' && (
          <>
            <View style={[styles.distressCard, { backgroundColor: colors.card }]}>
              <View style={styles.distressHeader}>
                <Text style={[styles.distressTitle, { color: colors.foreground }]}>Distress Listener</Text>
                <TouchableOpacity
                  style={[styles.toggle, { backgroundColor: distressListenerOn ? colors.primary : colors.muted }]}
                  onPress={() => setDistressListener(!distressListenerOn)}
                >
                  <View style={[styles.toggleKnob, { transform: [{ translateX: distressListenerOn ? 22 : 2 }] }]} />
                </TouchableOpacity>
              </View>
              {distressListenerOn && (
                <View style={styles.soundwave}>
                  {[20, 35, 50, 40, 60, 35, 45, 25, 30].map((h, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.bar,
                        {
                          backgroundColor: colors.primary,
                          height: h,
                          opacity: soundwaveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                          transform: [{ scaleY: soundwaveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5 + i * 0.05, 1] }) }],
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
              <Text style={[styles.listenStatus, { color: distressListenerOn ? colors.primary : colors.mutedForeground }]}>
                {distressListenerOn ? 'Listening for distress signals...' : 'Listener is off'}
              </Text>
            </View>
            <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Trigger Keyword</Text>
              <View style={[styles.keywordRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Ionicons name="mic" size={14} color={colors.primary} />
                <Text style={[styles.keyword, { color: colors.foreground }]}>{keyword}</Text>
              </View>
              <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 16 }]}>Sensitivity</Text>
              <View style={styles.sensitivityRow}>
                {(['Low', 'Medium', 'High'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sensBtn, { backgroundColor: sensitivity === s ? colors.primary : colors.secondary }]}
                    onPress={() => setSensitivity(s)}
                  >
                    <Text style={[styles.sensText, { color: sensitivity === s ? '#fff' : colors.foreground }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.simulateBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                onPress={() => setSOSVisible(true)}
              >
                <Ionicons name="flash" size={16} color={colors.primary} />
                <Text style={[styles.simulateText, { color: colors.primary }]}>Simulate Detection</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle" size={16} color={colors.accent} style={{ marginBottom: 8 }} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Rakshak listens in the background for your set keyword. When detected, it automatically triggers an SOS countdown and alerts your trusted contacts.
              </Text>
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
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.triggerBtnText}>Trigger Fake Call</Text>
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <Ionicons name="information-circle" size={18} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.mutedForeground, flex: 1 }]}>Your phone will ring like a real call</Text>
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
