import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface IncomingCallProps {
  visible: boolean;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCall({ visible, callerName, onAccept, onDecline }: IncomingCallProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(800)).current;
  const ringAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
      const ring = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      ring.start();
      return () => ring.stop();
    } else {
      slideAnim.setValue(800);
    }
  }, [visible]);

  const initials = callerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.inner}>
          <Text style={styles.status}>Incoming Call</Text>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: ringAnim }] }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </Animated.View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerSubtitle}>Mobile</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={onDecline}>
              <Feather name="phone-off" size={28} color="#fff" />
              <Text style={styles.actionLabel}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
              <Feather name="phone" size={28} color="#fff" />
              <Text style={styles.actionLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a14',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  status: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 40,
    letterSpacing: 1,
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: 'rgba(192,68,90,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
  },
  callerName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  callerSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginBottom: 60,
  },
  actions: {
    flexDirection: 'row',
    gap: 60,
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#3A7D44',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
