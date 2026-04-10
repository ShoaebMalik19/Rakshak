import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* SVG-like decorative background */}
        <View style={[styles.blob1, { backgroundColor: colors.primary + '15' }]} />
        <View style={[styles.blob2, { backgroundColor: colors.accent + '10' }]} />

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {steps.map((_, i) => (
            <View key={i} style={[
              styles.stepDot,
              {
                backgroundColor: i === step ? colors.primary : colors.border,
                width: i === step ? 24 : 8,
              }
            ]} />
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim, flex: 1, alignItems: 'center' }}>
          {/* Shield icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="shield" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.appName, { color: colors.primary }]}>Rakshak</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{steps[step].title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{steps[step].subtitle}</Text>

          {step === 0 && (
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Your Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
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
                  borderColor: colors.border,
                  color: colors.foreground,
                }]}
                placeholder="e.g. Mom, Sister"
                placeholderTextColor={colors.mutedForeground}
                value={contactName}
                onChangeText={setContactName}
              />
              <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
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
              {permissions.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.permRow, {
                    backgroundColor: colors.card,
                    borderColor: grantedPerms.includes(i) ? colors.safe : colors.border,
                  }]}
                  onPress={() => grantPerm(i)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.permIcon, {
                    backgroundColor: grantedPerms.includes(i) ? colors.safe + '20' : colors.secondary,
                  }]}>
                    <Feather name={p.icon} size={20} color={grantedPerms.includes(i) ? colors.safe : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.permLabel, { color: colors.foreground }]}>{p.label}</Text>
                    <Text style={[styles.permDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
                  </View>
                  {grantedPerms.includes(i) && (
                    <Feather name="check-circle" size={20} color={colors.safe} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: canNext() ? colors.primary : colors.muted,
              marginTop: 32,
            }
          ]}
          onPress={goNext}
          disabled={!canNext()}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, { color: canNext() ? '#fff' : colors.mutedForeground }]}>
            {step === 2 ? "Let's Go" : 'Continue'}
          </Text>
          <Feather name="arrow-right" size={18} color={canNext() ? '#fff' : colors.mutedForeground} />
        </TouchableOpacity>
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
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 50,
    left: -60,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 40,
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 22,
  },
  inputSection: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  permsSection: {
    width: '100%',
    gap: 12,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  permIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  permDesc: {
    fontSize: 12,
  },
  nextBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C0445A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
