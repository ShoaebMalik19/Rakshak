import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActiveCallProps {
  callerName: string;
  callerBg: string;
  callerColor: string;
  onEnd: () => void;
}

export default function ActiveCall({ callerName, callerBg, callerColor, onEnd }: ActiveCallProps) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const initials = callerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const controls = [
    { icon: muted ? 'mic-off' : 'mic', label: 'Mute', active: muted, onPress: () => setMuted(m => !m) },
    { icon: speakerOn ? 'volume-high' : 'volume-medium', label: 'Speaker', active: speakerOn, onPress: () => setSpeakerOn(s => !s) },
    { icon: 'pause', label: 'Hold', active: onHold, onPress: () => setOnHold(h => !h) },
    { icon: 'call', label: 'End', red: true, onPress: onEnd },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Header */}
      <View style={styles.topSection}>
        <Text style={styles.statusLabel}>{onHold ? 'ON HOLD' : 'ACTIVE CALL'}</Text>
        <View style={[styles.avatar, { backgroundColor: callerBg }]}>
          <Text style={[styles.initials, { color: callerColor }]}>{initials}</Text>
        </View>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.timer}>{fmt(seconds)}</Text>
        <Text style={styles.simLabel}>Rakshak Simulated Call</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <View style={styles.controlsGrid}>
          {controls.map((c, i) => (
            <TouchableOpacity key={i} style={[styles.controlCard, c.active && styles.controlCardActive, c.red && styles.controlCardRed]} onPress={c.onPress} activeOpacity={0.8}>
              <Ionicons
                name={c.icon as any}
                size={26}
                color={c.red ? '#fff' : c.active ? '#fff' : '#1C1612'}
                style={c.red ? { transform: [{ rotate: '135deg' }] } : undefined}
              />
              <Text style={[styles.controlLabel, (c.active || c.red) && { color: '#fff' }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.footNote}>This is a simulated call for your safety</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1612' },
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  statusLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  initials: { fontSize: 30, fontWeight: '800' },
  callerName: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  timer: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontFamily: 'monospace', marginBottom: 8 },
  simLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  controlsSection: { paddingHorizontal: 24, paddingBottom: 50 },
  controlsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  controlCard: { width: '46%', height: 72, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  controlCardActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  controlCardRed: { backgroundColor: '#FF3B30' },
  controlLabel: { fontSize: 11, fontWeight: '600', color: '#1C1612' },
  footNote: { textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 },
});
