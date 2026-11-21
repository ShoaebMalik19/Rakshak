import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useApp, uid } from '../context/AppContext';

const quotes = [
  '"Your safety is your right, not a privilege."',
  '"Be bold. Be brave. Be safe."',
  '"You are stronger than you know."',
  '"Every step forward is an act of courage."',
];

const isPhone = (v: string) => /^\+?[0-9][0-9\s-]{6,17}$/.test(v.trim());

export default function ProfileScreen({ route, navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    userName, setUserName, contacts, addContact, removeContact,
    totalSOS, journeysCompleted, incidentsReported,
    shakeToSOS, setShakeToSOS, setPrimaryContact, resetAll,
  } = useApp();

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 0 : insets.bottom;

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');
  const [addingContact, setAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'contacts' | 'evidence'>(route?.params?.tab ?? 'profile');

  // Deep link from Home ("Add an emergency contact") opens the Contacts tab.
  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
      if (route.params.tab === 'contacts' && contacts.length === 0) setAddingContact(true);
      navigation?.setParams?.({ tab: undefined });
    }
  }, [route?.params?.tab]);

  useEffect(() => { setNameInput(userName || ''); }, [userName]);

  const quote = quotes[new Date().getDay() % quotes.length];
  const safeUserName = String(userName || 'Friend');
  const initials = safeUserName.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'R';

  const safeContacts = contacts || [];
  const safeTotalSOS = totalSOS || 0;
  const safeJourneysCompleted = journeysCompleted || 0;
  const safeIncidentsReported = incidentsReported || 0;

  const saveContact = () => {
    if (!newName.trim() || !isPhone(newPhone)) return;
    addContact({
      id: uid(),
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}>

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
                    onPress={() => { if (nameInput.trim()) setUserName(nameInput.trim()); setEditingName(false); }}
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
                  { label: 'SOS Alerts', value: safeTotalSOS, icon: 'alert-circle' as const, color: colors.primary },
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
                { label: 'Shake to SOS', sub: Platform.OS === 'web' ? 'Works in the phone app (browsers have no shake sensor)' : 'Shake your phone hard to start the SOS countdown', value: shakeToSOS, onChange: setShakeToSOS },
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
                    {...({ activeThumbColor: "#fff" } as any)}
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
                Rakshak is your quiet guardian: a women's safety companion. Your contacts, journeys and reports are stored only on this device. Rakshak has no server and never contacts anyone without you seeing it happen.
              </Text>
              <Text style={[styles.version, { color: colors.mutedForeground }]}>Version 1.0.0 · Katha Hackathon winner</Text>
              {confirmReset ? (
                <View style={styles.resetRow}>
                  <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={() => setConfirmReset(false)}>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>Keep my data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resetBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={async () => { await resetAll(); setConfirmReset(false); navigation?.reset?.({ index: 0, routes: [{ name: 'Onboarding' }] }); }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Erase everything</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setConfirmReset(true)} style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Erase all data on this device</Text>
                </TouchableOpacity>
              )}
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
              <Text style={[styles.encryptText, { color: colors.safe }]}>Contacts are stored only on this device</Text>
            </View>
            {safeContacts.length === 0 && !addingContact && (
              <Text style={[styles.emptyContacts, { color: colors.mutedForeground }]}>
                No emergency contacts yet. SOS can't reach anyone until you add at least one.
              </Text>
            )}
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
                  {!contact.isPrimary && (
                    <TouchableOpacity onPress={() => setPrimaryContact(contact.id)}>
                      <Text style={[styles.makePrimary, { color: colors.primary }]}>Make primary</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  accessibilityLabel={`Remove ${contact.name}`}
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
                {!!newPhone.trim() && !isPhone(newPhone) && (
                  <Text style={[styles.phoneError, { color: colors.primary }]}>Enter a valid phone number, e.g. +91 followed by 10 digits</Text>
                )}
                <View style={styles.addActions}>
                  <TouchableOpacity
                    style={[styles.cancelAddBtn, { borderColor: colors.border }]}
                    onPress={() => { setAddingContact(false); setNewName(''); setNewPhone(''); }}
                  >
                    <Text style={[styles.cancelAddText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveAddBtn, { backgroundColor: colors.primary, opacity: newName.trim() && isPhone(newPhone) ? 1 : 0.5 }]}
                    onPress={saveContact}
                    disabled={!newName.trim() || !isPhone(newPhone)}
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
          <View style={[styles.evidenceEmpty, { backgroundColor: colors.card }]}>
            <View style={[styles.aboutIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="lock-closed" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>Evidence Vault</Text>
            <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
              No recordings yet. Planned: automatic audio recording during an SOS, stored encrypted on your phone.
              Recording is not built into this version, so nothing is being recorded.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContacts: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginVertical: 16, paddingHorizontal: 12 },
  makePrimary: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  phoneError: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  resetRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  resetBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5 },
  evidenceEmpty: { borderRadius: 18, padding: 24, alignItems: 'center' },
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
