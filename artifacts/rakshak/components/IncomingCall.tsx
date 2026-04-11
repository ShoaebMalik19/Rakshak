import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IncomingCallProps {
  visible: boolean;
  callerName: string;
  callerBg: string;
  callerColor: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCall({ visible, callerName, callerBg, callerColor, onAccept, onDecline }: IncomingCallProps) {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.7)).current;
  const ring2Opacity = useRef(new Animated.Value(0.45)).current;
  const ring3Opacity = useRef(new Animated.Value(0.2)).current;
  const slideIn = useRef(new Animated.Value(900)).current;

  useEffect(() => {
    if (!visible) { slideIn.setValue(900); return; }
    Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, tension: 80, friction: 14 }).start();

    const pulse = (anim: Animated.Value, opAnim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
          Animated.timing(opAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opAnim, { toValue: anim === ring1 ? 0.7 : anim === ring2 ? 0.45 : 0.2, duration: 0, useNativeDriver: true }),
        ]),
      ]));

    const a1 = pulse(ring1, ring1Opacity, 0);
    const a2 = pulse(ring2, ring2Opacity, 300);
    const a3 = pulse(ring3, ring3Opacity, 600);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [visible]);

  const initials = callerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideIn }] }]}>
        {/* Top area */}
        <View style={styles.topSection}>
          <Text style={styles.incomingLabel}>INCOMING CALL</Text>
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.ring3, { transform: [{ scale: ring3 }], opacity: ring3Opacity }]} />
            <Animated.View style={[styles.ring2, { transform: [{ scale: ring2 }], opacity: ring2Opacity }]} />
            <Animated.View style={[styles.ring1, { transform: [{ scale: ring1 }], opacity: ring1Opacity }]} />
            <View style={[styles.avatar, { backgroundColor: callerBg }]}>
              <Text style={[styles.initials, { color: callerColor }]}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerSub}>Rakshak · Simulated Call</Text>
        </View>

        {/* Bottom actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actions}>
            <View style={styles.actionCol}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} onPress={onDecline}>
                <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>
            <View style={styles.actionCol}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34C759' }]} onPress={onAccept}>
                <Ionicons name="call" size={32} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Accept</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1612' },
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  incomingLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ring3: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)' },
  ring2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)' },
  ring1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.13)' },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  initials: { fontSize: 38, fontWeight: '800' },
  callerName: { color: '#fff', fontSize: 32, fontWeight: '700', marginBottom: 8 },
  callerSub: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  actionsContainer: { paddingBottom: 60, paddingHorizontal: 40 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  actionCol: { alignItems: 'center', gap: 10 },
  actionBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
