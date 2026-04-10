import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ActiveCallProps {
  callerName: string;
  onEnd: () => void;
}

export default function ActiveCall({ callerName, onEnd }: ActiveCallProps) {
  const colors = useColors();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const initials = callerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: '#1a0a14' }]}>
      <Text style={styles.status}>In Call</Text>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <Text style={styles.callerName}>{callerName}</Text>
      <Text style={styles.timer}>{fmt(seconds)}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, muted && styles.activeControl]} onPress={() => setMuted(m => !m)}>
          <Feather name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
          <Text style={styles.controlLabel}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.endBtn]} onPress={onEnd}>
          <Feather name="phone-off" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, speaker && styles.activeControl]} onPress={() => setSpeaker(s => !s)}>
          <Feather name="volume-2" size={24} color="#fff" />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  status: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  initials: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  callerName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  timer: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    marginBottom: 60,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControl: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
  },
});
