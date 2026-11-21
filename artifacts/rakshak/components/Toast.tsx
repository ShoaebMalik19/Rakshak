import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, Platform } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  tone?: 'success' | 'info' | 'warning';
}

export default function Toast({ message, visible, onHide, tone = 'success' }: ToastProps) {
  const bg = tone === 'success' ? '#3A7D44' : tone === 'warning' ? '#B07D3A' : '#1C1612';
  const native = Platform.OS !== 'web';
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: native }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: native }),
      ]).start();

      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: native }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: native }),
        ]).start(() => onHide());
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.toast,
      { backgroundColor: bg, transform: [{ translateY }], opacity }
    ]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 440,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
