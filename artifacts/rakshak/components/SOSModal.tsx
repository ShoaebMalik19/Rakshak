import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface SOSModalProps {
  visible: boolean;
  onCancel: () => void;
  onComplete: () => void;
}

export default function SOSModal({ visible, onCancel, onComplete }: SOSModalProps) {
  const colors = useColors();
  const [count, setCount] = useState(5);
  const [sent, setSent] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCount(5);
      setSent(false);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || sent) return;
    if (count === 0) {
      setSent(true);
      setTimeout(() => onComplete(), 2000);
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, visible, sent]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}>
          {!sent ? (
            <>
              <View style={[styles.countCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.countText}>{count}</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Sending SOS Alert</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Your location and alert will be sent to your trusted contacts
              </Text>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.primary }]} onPress={onCancel}>
                <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.successCircle, { backgroundColor: '#3A7D44' }]}>
                <Feather name="check" size={36} color="#fff" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Alert Sent!</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Your contacts have been notified with your live location
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: 300,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  countCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  countText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    borderWidth: 2,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
