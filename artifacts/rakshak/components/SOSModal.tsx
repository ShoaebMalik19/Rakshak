import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform, ActivityIndicator, ScrollView, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import {
  buildSOSMessage, getCurrentLocation, sendSOSviaSMS, copyText, canWebShare, webShare, callNumber,
  LocationResult, SendResult,
} from '@/lib/emergency';

interface SOSModalProps {
  visible: boolean;
  onCancel: () => void;
  /** Called once the user closes the result screen, with an honest one-line summary. */
  onComplete: (summary: string) => void;
  /** Seconds before the alert is prepared. 0 skips straight to preparing. */
  countdownFrom?: number;
  /** Shown under the title, e.g. "Journey to Home is overdue". */
  reason?: string;
}

type Phase = 'countdown' | 'preparing' | 'result';

const OUTCOME_TEXT: Record<SendResult, { title: string; body: string; ok: boolean }> = {
  sent: { title: 'SOS sent', body: 'Your phone confirmed the SMS was sent to your contacts.', ok: true },
  'composer-opened': {
    title: 'Check your SMS app',
    body: 'The emergency message was opened in your SMS app. Make sure you pressed Send. Rakshak cannot confirm delivery.',
    ok: true,
  },
  cancelled: { title: 'SOS not sent', body: 'The SMS was cancelled. No one has been contacted.', ok: false },
  unavailable: {
    title: 'Not sent: send it yourself',
    body: Platform.OS === 'web'
      ? 'Browsers cannot send SMS, so no one has been contacted yet. Copy or share the message below, or call 112.'
      : 'This device cannot send SMS, so no one has been contacted yet. Copy the message or call 112.',
    ok: false,
  },
  failed: { title: 'SOS failed', body: 'Something went wrong opening SMS. No one has been contacted. Call 112.', ok: false },
};

export default function SOSModal({ visible, onCancel, onComplete, countdownFrom = 5, reason }: SOSModalProps) {
  const colors = useColors();
  const { userName, contacts } = useApp();
  const [phase, setPhase] = useState<Phase>('countdown');
  const [count, setCount] = useState(countdownFrom);
  const [loc, setLoc] = useState<LocationResult | null>(null);
  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const runId = useRef(0);

  useEffect(() => {
    if (visible) {
      runId.current += 1;
      setPhase(countdownFrom > 0 ? 'countdown' : 'preparing');
      setCount(countdownFrom);
      setLoc(null);
      setMessage('');
      setOutcome(null);
      setCopied(false);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();
      if (Platform.OS !== 'web') Vibration.vibrate([0, 300, 200, 300]);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || phase !== 'countdown') return;
    if (count <= 0) { setPhase('preparing'); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, visible, phase]);

  useEffect(() => {
    if (!visible || phase !== 'preparing') return;
    const myRun = runId.current;
    (async () => {
      const location = await getCurrentLocation();
      if (myRun !== runId.current) return;
      const msg = buildSOSMessage(userName, location);
      setLoc(location);
      setMessage(msg);
      const phones = contacts.map(c => c.phone).filter(Boolean);
      const result = await sendSOSviaSMS(phones, msg);
      if (myRun !== runId.current) return;
      setOutcome(phones.length === 0 && result === 'unavailable' ? 'unavailable' : result);
      setPhase('result');
    })();
  }, [phase, visible]);

  const cancel = () => { runId.current += 1; onCancel(); };

  const finish = () => {
    const summary = !outcome ? 'SOS cancelled'
      : outcome === 'sent' ? 'SOS sent by SMS'
      : outcome === 'composer-opened' ? 'SOS opened in SMS app'
      : outcome === 'cancelled' ? 'SOS cancelled before sending'
      : 'SOS prepared (not sent automatically)';
    onComplete(summary);
  };

  const noContacts = contacts.length === 0;
  const result = outcome ? OUTCOME_TEXT[outcome] : null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={phase === 'result' ? finish : cancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}>
          {phase === 'countdown' && (
            <>
              <View style={[styles.countCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.countText}>{count}</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Preparing SOS alert</Text>
              {!!reason && <Text style={[styles.reason, { color: colors.primary }]}>{reason}</Text>}
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {noContacts
                  ? 'You have no emergency contacts yet. We will prepare a message you can share, and you can call 112.'
                  : `We will get your location and prepare an SMS to ${contacts.map(c => c.name).join(', ')}.`}
              </Text>
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.primary }]} onPress={cancel}>
                <Text style={[styles.outlineText, { color: colors.primary }]}>Cancel, I'm safe</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'preparing' && (
            <>
              <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
              <Text style={[styles.title, { color: colors.foreground }]}>Getting your location…</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Allow location access if your browser or phone asks.
              </Text>
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.primary }]} onPress={cancel}>
                <Text style={[styles.outlineText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'result' && result && (
            <ScrollView contentContainerStyle={{ alignItems: 'center' }} style={{ width: '100%' }}>
              <View style={[styles.resultCircle, { backgroundColor: result.ok ? colors.safe : colors.accent }]}>
                <Ionicons name={result.ok ? 'checkmark' : 'alert'} size={36} color="#fff" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>{result.title}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, marginBottom: 14 }]}>
                {noContacts && outcome === 'unavailable'
                  ? 'You have no emergency contacts, so no one has been contacted. Add contacts in Profile. For now, share this message or call 112.'
                  : result.body}
              </Text>

              <View style={[styles.messageBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text selectable style={[styles.messageText, { color: colors.foreground }]}>{message}</Text>
                {loc && !loc.ok && (
                  <Text style={[styles.locWarn, { color: colors.accent }]}>
                    <Ionicons name="location-outline" size={12} /> No location in this message. Allow location access to include it next time.
                  </Text>
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: colors.secondary }]}
                  onPress={async () => setCopied(await copyText(message))}
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={colors.foreground} />
                  <Text style={[styles.smallBtnText, { color: colors.foreground }]}>{copied ? 'Copied' : 'Copy'}</Text>
                </TouchableOpacity>
                {canWebShare() && (
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.secondary }]} onPress={() => webShare(message)}>
                    <Ionicons name="share-outline" size={16} color={colors.foreground} />
                    <Text style={[styles.smallBtnText, { color: colors.foreground }]}>Share</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.primary }]} onPress={() => callNumber('112')}>
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={[styles.smallBtnText, { color: '#fff' }]}>Call 112</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.border, marginTop: 6 }]} onPress={finish}>
                <Text style={[styles.outlineText, { color: colors.foreground }]}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(28,22,18,0.65)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: {
    width: '100%', maxWidth: 360, maxHeight: '90%', padding: 28, borderRadius: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 20,
  },
  countCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  countText: { color: '#fff', fontSize: 44, fontWeight: '800' },
  resultCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 21, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  reason: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  messageBox: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 14 },
  messageText: { fontSize: 13, lineHeight: 19 },
  locWarn: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  smallBtnText: { fontSize: 13, fontWeight: '700' },
  outlineBtn: { paddingVertical: 12, paddingHorizontal: 36, borderRadius: 24, borderWidth: 2 },
  outlineText: { fontSize: 15, fontWeight: '700' },
});
