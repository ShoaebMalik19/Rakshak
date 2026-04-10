import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import SOSModal from '@/components/SOSModal';
import IncomingCall from '@/components/IncomingCall';
import ActiveCall from '@/components/ActiveCall';

const callers = [
  { id: 'mom', name: 'Mom', subtitle: 'Primary Contact' },
  { id: 'office', name: 'Office', subtitle: 'Work Contact' },
  { id: 'doctor', name: 'Dr. Sharma', subtitle: 'Doctor' },
];

const delays = [
  { label: 'Now', seconds: 0 },
  { label: '10 sec', seconds: 10 },
  { label: '30 sec', seconds: 30 },
];

export default function DetectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scans, addScan, distressListenerOn, setDistressListener, addActivity, triggerSOS } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Camera detect
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | 'safe' | 'alert'>(null);
  const radarAnim = useRef(new Animated.Value(0)).current;
  const radarLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Fake call
  const [selectedCaller, setSelectedCaller] = useState(callers[0]);
  const [selectedDelay, setSelectedDelay] = useState(delays[0]);
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'active'>('idle');
  const [countdown, setCountdown] = useState(0);

  // Distress
  const [sensitivity, setSensitivity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [keyword, setKeyword] = useState('help me');
  const [sosVisible, setSOSVisible] = useState(false);
  const soundwaveAnim = useRef(new Animated.Value(0)).current;

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
        id: Date.now().toString(),
        location: 'Current Location, Bengaluru',
        result,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      addActivity({
        id: Date.now().toString(),
        text: result === 'alert' ? 'Camera scan — potential threat detected' : 'Camera scan — all clear',
        time: 'Just now',
        icon: 'camera',
      });
    }, 4000);
  };

  const triggerFakeCall = () => {
    if (selectedDelay.seconds === 0) {
      setCallState('incoming');
    } else {
      setCountdown(selectedDelay.seconds);
      const t = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(t);
            setCallState('incoming');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  const radarRotate = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const [activeTab, setActiveTab] = useState<'camera' | 'distress' | 'fakecall'>('camera');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {callState === 'incoming' && (
        <IncomingCall
          visible={true}
          callerName={selectedCaller.name}
          onAccept={() => setCallState('active')}
          onDecline={() => setCallState('idle')}
        />
      )}
      {callState === 'active' && (
        <View style={StyleSheet.absoluteFill}>
          <ActiveCall callerName={selectedCaller.name} onEnd={() => setCallState('idle')} />
        </View>
      )}

      <SOSModal
        visible={sosVisible}
        onCancel={() => setSOSVisible(false)}
        onComplete={() => { setSOSVisible(false); triggerSOS(); }}
      />

      {callState === 'idle' && (
        <>
          <View style={[styles.header, { paddingTop: topPad + 8 }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Detection Tools</Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabRow, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
            {[
              { id: 'camera', label: 'Scanner', icon: 'camera' as const },
              { id: 'distress', label: 'Distress', icon: 'mic' as const },
              { id: 'fakecall', label: 'Fake Call', icon: 'phone' as const },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Feather name={tab.icon} size={14} color={activeTab === tab.id ? '#fff' : colors.mutedForeground} />
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
            {/* Camera Scanner */}
            {activeTab === 'camera' && (
              <>
                <View style={[styles.instructCard, { backgroundColor: colors.accent + '15' }]}>
                  <Feather name="info" size={16} color={colors.accent} />
                  <Text style={[styles.instructText, { color: colors.foreground }]}>
                    Point your phone around the room slowly while scanning
                  </Text>
                </View>

                {/* Radar */}
                <View style={[styles.radarOuter, { borderColor: colors.border }]}>
                  <View style={[styles.radarInner, { borderColor: colors.border }]}>
                    {scanning && (
                      <Animated.View
                        style={[styles.radarSweep, { transform: [{ rotate: radarRotate }] }]}
                      >
                        <View style={[styles.sweepLine, { backgroundColor: colors.safe }]} />
                      </Animated.View>
                    )}
                    {scanResult === 'safe' && !scanning && (
                      <View style={[styles.resultCircle, { backgroundColor: colors.safe + '20' }]}>
                        <Feather name="check" size={36} color={colors.safe} />
                      </View>
                    )}
                    {scanResult === 'alert' && !scanning && (
                      <View style={[styles.resultCircle, { backgroundColor: colors.primary + '20' }]}>
                        <Feather name="alert-triangle" size={36} color={colors.primary} />
                      </View>
                    )}
                    {!scanning && !scanResult && (
                      <View style={[styles.radarCenter, { backgroundColor: colors.safe + '30' }]}>
                        <Feather name="wifi" size={28} color={colors.safe} />
                      </View>
                    )}
                  </View>
                </View>

                {scanResult && (
                  <View style={[
                    styles.resultBanner,
                    { backgroundColor: scanResult === 'safe' ? colors.safe + '15' : colors.primary + '15' }
                  ]}>
                    <Text style={[styles.resultTitle, { color: scanResult === 'safe' ? colors.safe : colors.primary }]}>
                      {scanResult === 'safe' ? 'No hidden cameras detected' : 'Potential IR source detected at 2 o\'clock position'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.scanBtn, { backgroundColor: scanning ? colors.muted : colors.primary }]}
                  onPress={startScan}
                  disabled={scanning}
                >
                  <Feather name={scanning ? "loader" : "search"} size={18} color={scanning ? colors.mutedForeground : '#fff'} />
                  <Text style={[styles.scanBtnText, { color: scanning ? colors.mutedForeground : '#fff' }]}>
                    {scanning ? 'Scanning...' : 'Start Scan'}
                  </Text>
                </TouchableOpacity>

                {scans.length > 0 && (
                  <>
                    <Text style={[styles.histTitle, { color: colors.foreground }]}>Scan History</Text>
                    {scans.slice(0, 3).map(scan => (
                      <View key={scan.id} style={[styles.scanRecord, { backgroundColor: colors.card }]}>
                        <View style={[
                          styles.scanIcon,
                          { backgroundColor: scan.result === 'safe' ? colors.safe + '20' : colors.primary + '20' }
                        ]}>
                          <Feather
                            name={scan.result === 'safe' ? 'check-circle' : 'alert-triangle'}
                            size={16}
                            color={scan.result === 'safe' ? colors.safe : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.scanLoc, { color: colors.foreground }]}>{scan.location}</Text>
                          <Text style={[styles.scanTime, { color: colors.mutedForeground }]}>{scan.timestamp}</Text>
                        </View>
                        <Text style={[styles.scanResult, {
                          color: scan.result === 'safe' ? colors.safe : colors.primary
                        }]}>
                          {scan.result === 'safe' ? 'Clear' : 'Alert'}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Distress Listener */}
            {activeTab === 'distress' && (
              <>
                <View style={[styles.distressCard, { backgroundColor: colors.card }]}>
                  <View style={styles.distressHeader}>
                    <Text style={[styles.distressTitle, { color: colors.foreground }]}>Distress Listener</Text>
                    <TouchableOpacity
                      style={[styles.toggle, { backgroundColor: distressListenerOn ? colors.primary : colors.muted }]}
                      onPress={() => setDistressListener(!distressListenerOn)}
                    >
                      <View style={[styles.toggleKnob, {
                        transform: [{ translateX: distressListenerOn ? 22 : 2 }],
                      }]} />
                    </TouchableOpacity>
                  </View>

                  {distressListenerOn && (
                    <View style={styles.soundwave}>
                      {[...Array(9)].map((_, i) => {
                        const h = [20, 35, 50, 40, 60, 35, 45, 25, 30][i];
                        return (
                          <Animated.View
                            key={i}
                            style={[
                              styles.bar,
                              {
                                backgroundColor: colors.primary,
                                height: h,
                                opacity: soundwaveAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.4, 1],
                                }),
                                transform: [{
                                  scaleY: soundwaveAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5 + i * 0.05, 1],
                                  }),
                                }],
                              }
                            ]}
                          />
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.listenStatus, { color: distressListenerOn ? colors.primary : colors.mutedForeground }]}>
                    {distressListenerOn ? 'Listening for distress signals...' : 'Listener is off'}
                  </Text>
                </View>

                <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.settingLabel, { color: colors.foreground }]}>Trigger Keyword</Text>
                  <View style={[styles.keywordRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Feather name="mic" size={14} color={colors.primary} />
                    <Text style={[styles.keyword, { color: colors.foreground }]}>{keyword}</Text>
                  </View>

                  <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 16 }]}>Sensitivity</Text>
                  <View style={styles.sensitivityRow}>
                    {(['Low', 'Medium', 'High'] as const).map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.sensBtn, {
                          backgroundColor: sensitivity === s ? colors.primary : colors.secondary,
                        }]}
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
                    <Feather name="zap" size={16} color={colors.primary} />
                    <Text style={[styles.simulateText, { color: colors.primary }]}>Simulate Detection</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                  <Feather name="info" size={16} color={colors.accent} style={{ marginBottom: 8 }} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    Rakshak listens in the background for your set keyword. When detected, it automatically triggers an SOS countdown and alerts your trusted contacts.
                  </Text>
                </View>
              </>
            )}

            {/* Fake Call */}
            {activeTab === 'fakecall' && (
              <>
                <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.settingLabel, { color: colors.foreground }]}>Choose Caller</Text>
                  <View style={styles.callerRow}>
                    {callers.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.callerBtn, {
                          backgroundColor: selectedCaller.id === c.id ? colors.primary + '15' : colors.secondary,
                          borderColor: selectedCaller.id === c.id ? colors.primary : colors.border,
                        }]}
                        onPress={() => setSelectedCaller(c)}
                      >
                        <View style={[styles.callerAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.callerInitial}>{c.name[0]}</Text>
                        </View>
                        <Text style={[styles.callerName, { color: colors.foreground }]}>{c.name}</Text>
                        <Text style={[styles.callerSub, { color: colors.mutedForeground }]}>{c.subtitle}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 16 }]}>Call Delay</Text>
                  <View style={styles.delayRow}>
                    {delays.map(d => (
                      <TouchableOpacity
                        key={d.label}
                        style={[styles.delayBtn, {
                          backgroundColor: selectedDelay.label === d.label ? colors.primary : colors.secondary,
                        }]}
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
                      <Text style={[styles.countdownText, { color: colors.accent }]}>
                        Incoming call in {countdown}s...
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.fakeCallBtn, { backgroundColor: colors.safe }]}
                    onPress={triggerFakeCall}
                  >
                    <Feather name="phone-incoming" size={18} color="#fff" />
                    <Text style={styles.fakeCallBtnText}>Trigger Fake Call</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  tabRow: {
    flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 11, gap: 5,
  },
  tabText: { fontSize: 12, fontWeight: '600' },
  scroll: { paddingHorizontal: 16 },
  instructCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, marginBottom: 16,
  },
  instructText: { flex: 1, fontSize: 13, lineHeight: 18 },
  radarOuter: {
    width: 200, height: 200, borderRadius: 100, borderWidth: 1,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  radarInner: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  radarSweep: {
    position: 'absolute', width: 80, height: 80,
    top: 0, left: 40,
  },
  sweepLine: {
    width: 2, height: 80, borderRadius: 1, opacity: 0.8,
  },
  radarCenter: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  resultCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  resultBanner: {
    padding: 14, borderRadius: 14, marginBottom: 14,
  },
  resultTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scanBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  scanBtnText: { fontSize: 16, fontWeight: '700' },
  histTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  scanRecord: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  scanIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scanLoc: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  scanTime: { fontSize: 11 },
  scanResult: { fontSize: 12, fontWeight: '700' },
  distressCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  distressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  distressTitle: { fontSize: 18, fontWeight: '700' },
  toggle: {
    width: 50, height: 28, borderRadius: 14,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  soundwave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, height: 70, marginVertical: 8,
  },
  bar: { width: 5, borderRadius: 3 },
  listenStatus: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  settingsCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  settingLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  keywordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  infoText: { fontSize: 13, lineHeight: 20 },
  callerRow: { gap: 8 },
  callerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1.5,
    marginBottom: 4,
  },
  callerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  callerInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  callerName: { fontSize: 15, fontWeight: '600', flex: 1 },
  callerSub: { fontSize: 11 },
  delayRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  delayBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  delayText: { fontSize: 13, fontWeight: '600' },
  countdownBanner: { padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  countdownText: { fontSize: 15, fontWeight: '700' },
  fakeCallBtn: {
    height: 52, borderRadius: 26, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#3A7D44', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  fakeCallBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
