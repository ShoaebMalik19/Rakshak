import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import IncomingCall from '../components/IncomingCall';
import ActiveCall from '../components/ActiveCall';

const DEFAULT_CALLER = { name: 'Mom', initials: 'M', color: '#FCE4EC', textColor: '#C0445A' };

const CALLER_COLORS: Record<string, { bg: string; fg: string }> = {
  Mom: { bg: '#FCE4EC', fg: '#C0445A' },
  Office: { bg: '#E3F2FD', fg: '#1565C0' },
  'Dr. Sharma': { bg: '#E8F5E9', fg: '#3A7D44' },
  SOS: { bg: '#FCE4EC', fg: '#C0445A' },
};

export default function IncomingCallScreen({ route, navigation }: any) {
  const params = route?.params ?? {};
  const rawCaller = params.caller ?? DEFAULT_CALLER;

  const callerName = rawCaller.name || 'Mom';
  const colors = CALLER_COLORS[callerName] || { bg: '#FCE4EC', fg: '#C0445A' };

  const [callState, setCallState] = useState<'incoming' | 'active'>('incoming');

  const handleAccept = () => setCallState('active');
  const handleDecline = () => navigation.goBack();
  const handleEnd = () => navigation.goBack();

  return (
    <View style={styles.container}>
      {callState === 'incoming' ? (
        <IncomingCall
          visible={true}
          callerName={callerName}
          callerBg={colors.bg}
          callerColor={colors.fg}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ) : (
        <ActiveCall
          callerName={callerName}
          callerBg={colors.bg}
          callerColor={colors.fg}
          onEnd={handleEnd}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1612' },
});
