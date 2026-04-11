import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const steps = [
  { id: 0, title: 'What should we call you?', subtitle: "We'll personalize your safety experience", icon: 'person-circle' as const },
  { id: 1, title: 'Who should we alert?', subtitle: 'Add an emergency contact', icon: 'people' as const },
  { id: 2, title: 'Enable Permissions', subtitle: 'Rakshak needs these to protect you', icon: 'shield-checkmark' as const },
];

const permissions = [
  { icon: 'location' as const, label: 'Location', desc: 'To detect your position' },
  { icon: 'mic' as const, label: 'Microphone', desc: 'To detect distress sounds' },
  { icon: 'camera' as const, label: 'Camera', desc: 'To scan for hidden cameras' },
];

export default function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { setOnboardingComplete, setUserName, addContact } = useApp();
  const [step, setStep] = useState(-1);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [grantedPerms, setGrantedPerms] = useState<number[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const checkAnims = useRef(permissions.map(() => new Animated.Value(0))).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (step === 2 && grantedPerms.length > 0) {
      const idx = grantedPerms[grantedPerms.length - 1];
      Animated.spring(checkAnims[idx], {
        toValue: 1, useNativeDriver: true, tension: 200, friction: 10
      }).start();
    }
  }, [grantedPerms]);

  const goNext = () => {
    if (step === 0 && !name.trim()) return;
    if (step === 1 && (!contactName.trim() || !contactPhone.trim())) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    if (step < 2) setStep(s => s + 1);
    else finish();
  };

  const grantPerm = (idx: number) => {
    if (!grantedPerms.includes(idx)) setGrantedPerms(prev => [...prev, idx]);
  };

  const finish = () => {
    const safeName = name.trim() || 'Priya';
    setUserName(safeName);
    if (contactName.trim() && contactPhone.trim()) {
      addContact({
        id: Date.now().toString() + Math.random(),
        name: contactName.trim(),
        phone: contactPhone.trim(),
        isPrimary: true,
        shareLocation: true,
      });
    }
    setOnboardingComplete(true);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return contactName.trim().length > 0 && contactPhone.trim().length > 0;
    return grantedPerms.length === 3;
  };

  if (step === -1) {
    return (
      <View style={[styles.splash, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />
        <View style={styles.splashCenter}>
          <View style={styles.splashIconWrap}>
            <Ionicons name="shield-checkmark" size={72} color="#C0445A" />
          </View>
          <Text style={styles.splashAppName}>Rakshak</Text>
          <Text style={styles.splashTagline}>Your quiet guardian, always.</Text>
          <View style={styles.splashDivider} />
        </View>
        <View style={styles.splashBottom}>
          <TouchableOpacity style={styles.getStartedBtn} onPress={() => setStep(0)} activeOpacity={0.88}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed" size={12} color="#9C8878" />
            <Text style={styles.privacyText}>Your data stays only on your device</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAF6EF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.blobTR} />
      <View style={styles.blobBL} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepRow}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.stepDot, { backgroundColor: i <= step ? '#C0445A' : '#E0D6CC', width: i === step ? 28 : 8 }]} />
          ))}
        </View>

        <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
          <View style={styles.stepIconWrap}>
            <Ionicons name={steps[step].icon} size={80} color="#C0445A" />
          </View>
          <Text style={styles.stepTitle}>{steps[step].title}</Text>
          <Text style={styles.stepSubtitle}>{steps[step].subtitle}</Text>

          {step === 0 && (
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.input, { borderColor: name.trim() ? '#C0445A' : '#DDD3C8' }]}
                placeholder="Enter your name"
                placeholderTextColor="#A89884"
                value={name}
                onChangeText={setName}
                autoFocus
                textAlign="center"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              <TextInput
                style={[styles.input, { borderColor: contactName.trim() ? '#C0445A' : '#DDD3C8', textAlign: 'left', paddingHorizontal: 18 }]}
                placeholder="e.g. Mom, Sister"
                placeholderTextColor="#A89884"
                value={contactName}
                onChangeText={setContactName}
              />
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { borderColor: contactPhone.trim() ? '#C0445A' : '#DDD3C8', textAlign: 'left', paddingHorizontal: 18 }]}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#A89884"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity onPress={finish} style={styles.skipBtn}>
                <Text style={styles.skipText}>I'll add later</Text>
              </TouchableOpacity>
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
                      borderColor: granted ? '#3A7D44' : '#E0D6CC',
                      backgroundColor: granted ? '#3A7D4408' : '#fff'
                    }]}
                    onPress={() => grantPerm(i)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.permIcon, { backgroundColor: granted ? '#3A7D4420' : '#F5F0EB' }]}>
                      <Ionicons name={p.icon} size={22} color={granted ? '#3A7D44' : '#9C8878'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.permLabel, { color: '#1C1612' }]}>{p.label}</Text>
                      <Text style={[styles.permDesc, { color: '#9C8878' }]}>{p.desc}</Text>
                    </View>
                    <Animated.View
                      style={[
                        styles.permCheck,
                        { backgroundColor: granted ? '#3A7D44' : '#E0D6CC', transform: [{ scale: checkAnims[i] }] }
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.permHint}>Tap each permission to grant access</Text>
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canNext() ? '#C0445A' : '#D9CFC9' }]}
          onPress={goNext}
          disabled={!canNext()}
          activeOpacity={0.87}
        >
          <Text style={[styles.nextText, { color: canNext() ? '#fff' : '#A89884' }]}>
            {step === 2 ? 'Start Protecting Me' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#FAF6EF', justifyContent: 'space-between', alignItems: 'center' },
  blobTR: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#C0445A', opacity: 0.15, top: -80, right: -80 },
  blobBL: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#B07D3A', opacity: 0.12, bottom: -60, left: -60 },
  splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashIconWrap: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#C0445A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, marginBottom: 24,
  },
  splashAppName: { fontSize: 42, fontWeight: '700', color: '#1C1612', letterSpacing: 0.5, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia' },
  splashTagline: { fontSize: 16, color: '#9C8878', marginTop: 8, fontStyle: 'italic' },
  splashDivider: { width: 40, height: 2, backgroundColor: '#C0445A', marginTop: 16, borderRadius: 2 },
  splashBottom: { width: '100%', paddingHorizontal: 28, paddingBottom: 8 },
  getStartedBtn: {
    width: '100%', height: 56, backgroundColor: '#C0445A', borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  getStartedText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: 8 },
  privacyText: { fontSize: 12, color: '#9C8878' },
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24 },
  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 36, alignItems: 'center' },
  stepDot: { height: 8, borderRadius: 4 },
  stepContent: { width: '100%', alignItems: 'center' },
  stepIconWrap: { marginBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#1C1612', textAlign: 'center', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#9C8878', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  inputSection: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#9C8878', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { width: '100%', height: 56, borderRadius: 16, borderWidth: 1.5, backgroundColor: '#fff', fontSize: 18, textAlign: 'center' },
  skipBtn: { alignItems: 'center', marginTop: 16 },
  skipText: { fontSize: 13, color: '#9C8878', textDecorationLine: 'underline' },
  permsSection: { width: '100%', gap: 10 },
  permRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 16, borderWidth: 1.5, gap: 14,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  permIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  permLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  permDesc: { fontSize: 12 },
  permCheck: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  permHint: { fontSize: 12, textAlign: 'center', color: '#9C8878', marginTop: 4 },
  nextBtn: {
    width: '100%', height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  nextText: { fontSize: 17, fontWeight: '600' },
});
