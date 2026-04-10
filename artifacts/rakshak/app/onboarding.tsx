import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const steps = [
  { id: 1, title: 'Welcome to Rakshak', subtitle: 'Your quiet guardian, always.' },
  { id: 2, title: 'Add Your First Contact', subtitle: 'Who should we alert in an emergency?' },
  { id: 3, title: 'Allow Permissions', subtitle: 'Rakshak needs these to protect you' },
];

const permissions = [
  { icon: 'map-pin' as const, label: 'Location', desc: 'For safe routes & SOS' },
  { icon: 'mic' as const, label: 'Microphone', desc: 'For distress detection' },
  { icon: 'camera' as const, label: 'Camera', desc: 'For spy cam detector' },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setOnboardingComplete, setUserName, addContact } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [grantedPerms, setGrantedPerms] = useState<number[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const goNext = () => {
    if (step === 0 && !name.trim()) return;
    if (step === 1 && (!contactName.trim() || !contactPhone.trim())) return;

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    if (step < 2) setStep(s => s + 1);
    else finish();
  };

  const grantPerm = (idx: number) => {
    if (!grantedPerms.includes(idx)) {
      setGrantedPerms(prev => [...prev, idx]);
    }
  };

  const finish = () => {
    setUserName(name.trim() || 'Priya');
    if (contactName.trim() && contactPhone.trim()) {
      addContact({
        id: Date.now().toString(),
        name: contactName.trim(),
        phone: contactPhone.trim(),
        isPrimary: false,
        shareLocation: false,
      });
    }
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return contactName.trim().length > 0 && contactPhone.trim().length > 0;
    return grantedPerms.length === 3;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Decorative background blobs */}
      <View style={[styles.blob1, { backgroundColor: colors.primary + '12' }]} />
      <View style={[styles.blob2, { backgroundColor: colors.accent + '10' }]} />
      <View style={[styles.blob3, { backgroundColor: colors.primary + '08' }]} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {steps.map((_, i) => (
            <View key={i} style={[
              styles.stepDot,
              {
                backgroundColor: i <= step ? colors.primary : colors.border,
                width: i === step ? 28 : 8,
              }
            ]} />
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          {/* Shield icon with pulse */}
          <View style={styles.iconWrapper}>
            <Animated.View style={[
              styles.iconRing,
              { borderColor: colors.primary + '30', transform: [{ scale: pulseAnim }] }
            ]} />
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="shield" size={46} color={colors.primary} />
            </View>
          </View>

          {/* Brand name in Cormorant Garamond */}
          <Text style={[styles.appName, { color: colors.primary, fontFamily: 'CormorantGaramond_700Bold' }]}>
            Rakshak
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{steps[step].title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{steps[step].subtitle}</Text>

          {step === 0 && (
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Your Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: name.trim() ? colors.primary : colors.border,
                  color: colors.foreground,
                }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Contact Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: contactName.trim() ? colors.primary : colors.border,
                  color: colors.foreground,
                }]}
                placeholder="e.g. Mom, Sister"
                placeholderTextColor={colors.mutedForeground}
                value={contactName}
                onChangeText={setContactName}
              />
              <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 14 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: contactPhone.trim() ? colors.primary : colors.border,
                  color: colors.foreground,
                }]}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={colors.mutedForeground}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.permsSection}>
              {permissions.map((p, i) => {
                const granted = grantedPerms.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.permRow, {
                      backgroundColor: colors.card,
                      borderColor: granted ? '#3A7D44' : colors.border,
                      shadowColor: granted ? '#3A7D44' : '#000',
                      shadowOpacity: granted ? 0.15 : 0.05,
                    }]}
                    onPress={() => grantPerm(i)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.permIcon, {
                      backgroundColor: granted ? '#3A7D44' + '20' : colors.secondary,
                    }]}>
                      <Feather name={p.icon} size={20} color={granted ? '#3A7D44' : colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.permLabel, { color: colors.foreground }]}>{p.label}</Text>
                      <Text style={[styles.permDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
                    </View>
                    <View style={[
                      styles.permCheck,
                      { backgroundColor: granted ? '#3A7D44' : colors.border }
                    ]}>
                      {granted && <Feather name="check" size={12} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={[styles.permHint, { color: colors.mutedForeground }]}>
                Tap each permission to grant access
              </Text>
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: canNext() ? colors.primary : colors.muted,
              marginTop: 36,
            }
          ]}
          onPress={goNext}
          disabled={!canNext()}
          activeOpacity={0.87}
        >
          <Text style={[styles.nextText, { color: canNext() ? '#fff' : colors.mutedForeground }]}>
            {step === 2 ? "Let's Go" : 'Continue'}
          </Text>
          <Feather name={step === 2 ? "shield" : "arrow-right"} size={18} color={canNext() ? '#fff' : colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={[styles.skipHint, { color: colors.mutedForeground + '80' }]}>
          Your data stays only on your device
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  blob1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    top: -120, right: -90,
  },
  blob2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    bottom: 60, left: -80,
  },
  blob3: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    top: '40%', right: -60,
  },
  stepRow: {
    flexDirection: 'row', gap: 6, marginBottom: 44, alignItems: 'center',
  },
  stepDot: { height: 8, borderRadius: 4 },
  iconWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  iconRing: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 2,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: {
    fontSize: 44, letterSpacing: 1, marginBottom: 8,
  },
  title: {
    fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 15, textAlign: 'center', marginBottom: 36, lineHeight: 22,
  },
  inputSection: { width: '100%' },
  label: {
    fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%', height: 54, borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 18, fontSize: 16,
  },
  permsSection: { width: '100%', gap: 10 },
  permRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
    borderWidth: 1.5, gap: 14, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  permIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  permLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  permDesc: { fontSize: 12 },
  permCheck: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  permHint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  nextBtn: {
    width: '100%', height: 56, borderRadius: 28, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  nextText: { fontSize: 17, fontWeight: '700' },
  skipHint: { fontSize: 12, marginTop: 16 },
});
