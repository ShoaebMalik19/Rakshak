import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useApp } from '../context/AppContext';

const quotes = [
  '"Your safety is your right, not a privilege."',
  '"Be bold. Be brave. Be safe."',
  '"You are stronger than you know."',
  '"Every step forward is an act of courage."',
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    userName, setUserName, contacts, addContact, removeContact,
    totalSOS, journeysCompleted, incidentsReported,
    distressListenerOn, setDistressListener
  } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || 'Priya');
  const [addingContact, setAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [shakeToSOS, setShakeToSOS] = useState(true);
  const [autoAlert, setAutoAlert] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'contacts' | 'evidence'>('profile');

  const quote = quotes[new Date().getDay() % quotes.length];
  const safeUserName = String(userName || 'Priya');
  const initials = safeUserName.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'P';

  const safeContacts = contacts || [];
  const safeTotalSOS = totalSOS || 0;
  const safeJourneysCompleted = journeysCompleted || 0;
  const safeIncidentsReported = incidentsReported || 0;

  const evidence = [
    { id: '1', timestamp: 'Apr 8, 2026 · 10:32 PM', type: 'Audio' as const, duration: '2m 15s', sosEvent: 'SOS Event #003' },
    { id: '2', timestamp: 'Apr 6, 2026 · 8:17 PM', type: 'Video' as const, duration: '0m 47s', sosEvent: 'SOS Event #002' },
    { id: '3', timestamp: 'Apr 3, 2026 · 11:02 PM', type: 'Audio' as const, duration: '1m 30s', sosEvent: 'SOS Event #001' },
  ];

  const saveContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    addContact({
      id: Date.now().toString() + Math.random(),
      name: newName.trim(),
      phone: newPhone.trim(),
      isPrimary: false,
      shareLocation: false,
    });
    setNewName('');
    setNewPhone('');
    setAddingContact(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabRow, { backgroundColor: colors.card, paddingTop: topPad + 8, paddingHorizontal: 16 }]}>
        {[
          { id: 'profile', label: 'Profile', icon: 'person-outline' as const },
          { id: 'contacts', label: 'Contacts', icon: 'people-outline' as const },
          { id: 'evidence', label: 'Evidence', icon: 'lock-closed-outline' as const },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}>

        {activeTab === 'profile' && (
          <>
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.saveNameBtn, { backgroundColor: colors.primary }]}
                    onPress={() => { setUserName(nameInput); setEditingName(false); }}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.nameRow}>
                  <Text style={[styles.nameText, { color: colors.foreground }]}>{safeUserName}</Text>
                  <TouchableOpacity onPress={() => setEditingName(true)}>
                    <Ionicons name="pencil" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Safety Stats</Text>
              <View style={styles.statsRow}>
                {[
                  { label: 'SOS Triggered', value: safeTotalSOS, icon: 'alert-circle' as const, color: colors.primary },
                  { label: 'Journeys', value: safeJourneysCompleted, icon: 'navigate' as const, color: colors.safe },
                  { label: 'Incidents', value: safeIncidentsReported, icon: 'flag' as const, color: colors.accent },
                ].map((s, i) => (
                  <View key={i} style={[styles.statItem, { backgroundColor: s.color + '10' }]}>
                    <Ionicons name={s.icon} size={20} color={s.color} />
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{String(s.value)}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Safety Settings</Text>
              {[
                { label: 'Shake to SOS', sub: 'Shake phone vigorously to trigger SOS', value: shakeToSOS, onChange: setShakeToSOS },
                { label: 'Scream Detection', sub: 'Auto-detect distress sounds', value: distressListenerOn, onChange: setDistressListener },
                { label: 'Journey Auto-Alert', sub: "Alert contacts if you don't arrive on time", value: autoAlert, onChange: setAutoAlert },
              ].map((setting, i) => (
                <View key={i} style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingName, { color: colors.foreground }]}>{setting.label}</Text>
                    <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>{setting.sub}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={setting.onChange}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>

            <View style={[styles.aboutCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
              <View style={[styles.aboutIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.aboutTitle, { color: colors.foreground }]}>About Rakshak</Text>
              <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
                Rakshak is your quiet guardian — a women's safety companion that works entirely offline. All data is stored on your device.
              </Text>
              <Text style={[styles.version, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            </View>

            <View style={[styles.quoteCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.quoteText, { color: colors.foreground }]}>{quote}</Text>
              <Text style={[styles.quoteBy, { color: colors.primary }]}>Stay Safe</Text>
            </View>
          </>
        )}

        {activeTab === 'contacts' && (
          <>
            <View style={[styles.encryptBanner, { backgroundColor: colors.safe + '15' }]}>
              <Ionicons name="lock-closed" size={14} color={colors.safe} />
              <Text style={[styles.encryptText, { color: colors.safe }]}>Contacts are stored securely on your device</Text>
            </View>
            {safeContacts.map(contact => (
              <View key={contact.id} style={[styles.contactCard, { backgroundColor: colors.card, borderLeftColor: contact.isPrimary ? colors.primary : colors.safe }]}>
                <View style={[styles.contactAvatar, { backgroundColor: contact.isPrimary ? colors.primary : colors.muted }]}>
                  <Text style={[styles.contactInitial, { color: contact.isPrimary ? '#fff' : colors.mutedForeground }]}>
                    {(contact.name || '?')[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.contactNameRow}>
                    <Text style={[styles.contactName, { color: colors.foreground }]}>{String(contact.name || '')}</Text>
                    {contact.isPrimary && (
                      <View style={[styles.primaryBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.primaryText, { color: colors.primary }]}>Primary</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.contactPhone, { color: colors.mutedForeground }]}>{String(contact.phone || '')}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeContact(contact.id)}
                  style={[styles.deleteBtn, { backgroundColor: colors.primary + '10' }]}
                >
                  <Ionicons name="trash" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            {addingContact ? (
              <View style={[styles.addForm, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                <TextInput
                  style={[styles.addInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Contact Name"
                  placeholderTextColor={colors.mutedForeground}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TextInput
                  style={[styles.addInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
                <View style={styles.addActions}>
                  <TouchableOpacity
                    style={[styles.cancelAddBtn, { borderColor: colors.border }]}
                    onPress={() => { setAddingContact(false); setNewName(''); setNewPhone(''); }}
                  >
                    <Text style={[styles.cancelAddText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveAddBtn, { backgroundColor: colors.primary }]}
                    onPress={saveContact}
                    disabled={!newName.trim() || !newPhone.trim()}
                  >
                    <Text style={styles.saveAddText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addContactBtn, { borderColor: colors.primary }]}
                onPress={() => setAddingContact(true)}
              >
                <Ionicons name="person-add" size={18} color={colors.primary} />
                <Text style={[styles.addContactText, { color: colors.primary }]}>Add Emergency Contact</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === 'evidence' && (
          <>
            {evidence.map(e => (
              <View key={e.id} style={[styles.evidenceCard, { backgroundColor: colors.card, borderLeftColor: e.type === 'Audio' ? colors.accent : colors.primary }]}>
                <View style={[styles.evidenceIcon, { backgroundColor: e.type === 'Audio' ? colors.accent + '20' : colors.primary + '20' }]}>
                  <Ionicons name={e.type === 'Audio' ? 'mic' : 'videocam'} size={18} color={e.type === 'Audio' ? colors.accent : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.evidenceType, { color: colors.foreground }]}>{e.type} Recording</Text>
                  <Text style={[styles.evidenceTimestamp, { color: colors.mutedForeground }]}>{e.timestamp}</Text>
                  <Text style={[styles.evidenceDuration, { color: colors.mutedForeground }]}>{e.duration} · {e.sosEvent}</Text>
                </View>
                <View style={styles.evidenceActions}>
                  <TouchableOpacity style={[styles.evidenceBtn, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="play" size={14} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.evidenceBtn, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="share" size={14} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.evidenceBtn, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="trash" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', paddingBottom: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#C0445A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameText: { fontSize: 24, fontWeight: '800' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, fontSize: 16, width: 200 },
  saveNameBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsCard: { borderRadius: 20, padding: 18, marginBottom: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statItem: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  settingsCard: { borderRadius: 20, padding: 18, marginBottom: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  settingName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingSub: { fontSize: 12, lineHeight: 16 },
  aboutCard: { borderRadius: 20, padding: 18, marginBottom: 14, alignItems: 'center', borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  aboutIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  aboutTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  aboutText: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  version: { fontSize: 12 },
  quoteCard: { borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1, alignItems: 'center' },
  quoteText: { fontSize: 16, fontStyle: 'italic', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  quoteBy: { fontSize: 13, fontWeight: '700' },
  encryptBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 14 },
  encryptText: { fontSize: 13, fontWeight: '600' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, marginBottom: 10, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactInitial: { fontSize: 20, fontWeight: '700' },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  contactName: { fontSize: 15, fontWeight: '700' },
  primaryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  primaryText: { fontSize: 10, fontWeight: '700' },
  contactPhone: { fontSize: 13 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addForm: { borderRadius: 18, padding: 16, marginBottom: 12, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  addInput: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15, marginBottom: 10 },
  addActions: { flexDirection: 'row', gap: 10 },
  cancelAddBtn: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelAddText: { fontSize: 14, fontWeight: '600' },
  saveAddBtn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  saveAddText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, borderWidth: 2, marginBottom: 10 },
  addContactText: { fontSize: 15, fontWeight: '700' },
  evidenceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 10, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  evidenceIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  evidenceType: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  evidenceTimestamp: { fontSize: 11, marginBottom: 1 },
  evidenceDuration: { fontSize: 11 },
  evidenceActions: { flexDirection: 'row', gap: 6 },
  evidenceBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
