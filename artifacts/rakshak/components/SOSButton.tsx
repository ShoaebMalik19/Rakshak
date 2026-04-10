import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface SOSButtonProps {
  onSOSTriggered: () => void;
}

export default function SOSButton({ onSOSTriggered }: SOSButtonProps) {
  const colors = useColors();
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    setPressing(true);
    setProgress(0);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 50;
      setProgress(Math.min(elapsed / 1500, 1));
    }, 50);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      setProgress(1);
      setPressing(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onSOSTriggered();
    }, 1500);
  };

  const handlePressOut = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPressing(false);
    setProgress(0);
  };

  const ringSize = 140;
  const buttonSize = 110;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.ring,
        {
          width: ringSize + 20,
          height: ringSize + 20,
          borderRadius: (ringSize + 20) / 2,
          borderColor: colors.primary,
          transform: [{ scale: pulseAnim }],
          opacity: 0.3,
        }
      ]} />
      <Animated.View style={[
        styles.ring,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderColor: colors.primary,
          transform: [{ scale: pulseAnim }],
          opacity: 0.5,
        }
      ]} />
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: colors.primary,
          }
        ]}
      >
        {pressing && (
          <View style={[styles.progressRing, {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            borderColor: 'rgba(255,255,255,0.6)',
          }]} />
        )}
        <Text style={styles.sosText}>SOS</Text>
        <Text style={styles.holdText}>{pressing ? `${Math.round(progress * 100)}%` : 'Hold'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C0445A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
  },
  holdText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 1,
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 3,
  },
});
