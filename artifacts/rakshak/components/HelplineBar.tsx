import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const helplines = [
  { label: 'Police', number: '100', icon: 'shield', dot: '#C0445A' },
  { label: "Women's", number: '1091', icon: 'heart', dot: '#D45A7A' },
  { label: 'Ambulance', number: '108', icon: 'activity', dot: '#B07D3A' },
];

export default function HelplineBar() {
  const colors = useColors();
  const [selected, setSelected] = useState<typeof helplines[0] | null>(null);

  return (
    <>
      <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
        {helplines.map(h => (
          <TouchableOpacity key={h.number} style={[styles.pill, { backgroundColor: colors.secondary }]} onPress={() => setSelected(h)} activeOpacity={0.7}>
            <View style={[styles.dot, { backgroundColor: h.dot }]} />
            <Feather name={h.icon as any} size={14} color={colors.primary} />
            <Text style={[styles.pillText, { color: colors.foreground }]}>{h.label} {h.number}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Modal transparent visible={!!selected} animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setSelected(null)} activeOpacity={1}>
          <View style={[styles.dialModal, { backgroundColor: colors.card }]}>
            <View style={[styles.dialIcon, { backgroundColor: colors.safe + '20' }]}>
              <Feather name="phone" size={32} color={colors.safe} />
            </View>
            <Text style={[styles.dialTitle, { color: colors.foreground }]}>Calling {selected?.label} Helpline</Text>
            <Text style={[styles.dialNumber, { color: colors.primary }]}>{selected?.number}</Text>
            <Text style={[styles.dialSubtitle, { color: colors.mutedForeground }]}>Dialing...</Text>
            <TouchableOpacity style={[styles.endBtn, { backgroundColor: colors.primary }]} onPress={() => setSelected(null)}>
              <Feather name="phone-off" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, gap: 8 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 20, gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 11, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  dialModal: { width: 280, padding: 32, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 16 },
  dialIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dialTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  dialNumber: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
  dialSubtitle: { fontSize: 14, marginBottom: 24 },
  endBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});