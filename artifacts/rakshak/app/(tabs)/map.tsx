import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, TextInput, Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import Toast from '@/components/Toast';

const dangerZones = [
  { id: '1', name: 'Silk Board Junction', desc: 'High harassment reported', severity: 'high', reports: 14 },
  { id: '2', name: 'BTM Layout Night', desc: 'Poor lighting zone', severity: 'medium', reports: 7 },
  { id: '3', name: 'Majestic Bus Stand', desc: 'Theft reported frequently', severity: 'high', reports: 23 },
  { id: '4', name: 'Yeshwanthpur Area', desc: 'Suspicious persons reported', severity: 'medium', reports: 5 },
  { id: '5', name: 'KR Market Late Night', desc: 'Poorly lit, avoid after 9pm', severity: 'low', reports: 3 },
];

const safeZones = [
  { id: 's1', name: 'Indiranagar', desc: 'Well-lit, CCTV covered' },
  { id: 's2', name: 'Koramangala', desc: 'High footfall, safe area' },
  { id: 's3', name: 'Whitefield IT Park', desc: 'Security patrolled, 24/7' },
];

const routes = [
  { id: '1', name: 'Route via Indiranagar', score: 91, distance: '4.2 km', time: '18 min', lighting: 'Good', crowd: 'High' },
  { id: '2', name: 'Route via Domlur', score: 74, distance: '3.8 km', time: '16 min', lighting: 'Moderate', crowd: 'Medium' },
  { id: '3', name: 'Route via Silk Board', score: 58, distance: '3.1 km', time: '14 min', lighting: 'Poor', crowd: 'Low' },
];

const incidentTypes = ['Harassment', 'Poor Lighting', 'Theft', 'Suspicious Person'];

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'route' | 'zones'>('route');
  const [fromInput, setFromInput] = useState('Home');
  const [toInput, setToInput] = useState('MG Road Metro');
  const [selectedRoute, setSelectedRoute] = useState('1');
  const [reportVisible, setReportVisible] = useState(false);
  const [incidentType, setIncidentType] = useState(incidentTypes[0]);
  const [anonymous, setAnonymous] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const scoreColor = (score: number) => {
    if (score >= 80) return colors.safe;
    if (score >= 65) return '#B07D3A';
    return colors.primary;
  };

  const severityColor = (s: string) => {
    if (s === 'high') return colors.primary;
    if (s === 'medium') return '#B07D3A';
    return '#4A90D9';
  };

  const submitReport = () => {
    setReportVisible(false);
    addActivity({ id: Date.now().toString(), text: 'Incident reported', time: 'Just now', icon: 'alert-triangle' });
    setToastMsg('Report submitted anonymously. Thank you.');
    setToastVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Map</Text>
        <TouchableOpacity
          style={[styles.heatmapBtn, { backgroundColor: heatmapOn ? colors.primary : colors.card }]}
          onPress={() => setHeatmapOn(h => !h)}
        >
          <Feather name="layers" size={16} color={heatmapOn ? '#fff' : colors.foreground} />
          <Text style={{ color: heatmapOn ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '600' }}>
            {heatmapOn ? 'Heatmap ON' : 'Heatmap'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
        {(['route', 'zones'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.mutedForeground }]}>
              {tab === 'route' ? 'Safe Routes' : 'Danger Zones'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'route' && (
          <>
            {/* Map placeholder */}
            <View style={[styles.mapBox, { backgroundColor: colors.card }]}>
              <View style={[styles.mapOverlay]}>
                <View style={[styles.mapDecor, { backgroundColor: '#3A7D44' + '30', borderColor: '#3A7D44', top: 40, left: 30, width: 80, height: 80, borderRadius: 40 }]} />
                <View style={[styles.mapDecor, { backgroundColor: '#C0445A' + '20', borderColor: '#C0445A', bottom: 30, right: 40, width: 60, height: 60, borderRadius: 30 }]} />
                <View style={[styles.mapDecor, { backgroundColor: '#B07D3A' + '25', borderColor: '#B07D3A', top: 80, right: 60, width: 50, height: 50, borderRadius: 25 }]} />
              </View>
              <View style={styles.mapContent}>
                <Feather name="map" size={40} color={colors.mutedForeground + '80'} />
                <Text style={[styles.mapLabel, { color: colors.mutedForeground }]}>Bengaluru Map</Text>
                <Text style={[styles.mapSub, { color: colors.mutedForeground + '80' }]}>12.9716° N, 77.5946° E</Text>
              </View>

              {/* Route lines */}
              <View style={styles.routeLines}>
                <View style={[styles.routeLine, { backgroundColor: '#3A7D44', opacity: selectedRoute === '1' ? 1 : 0.3 }]} />
                <View style={[styles.routeLine, { backgroundColor: '#B07D3A', opacity: selectedRoute === '2' ? 1 : 0.3 }]} />
                <View style={[styles.routeLine, { backgroundColor: '#C0445A', opacity: selectedRoute === '3' ? 1 : 0.3, transform: [{ rotate: '5deg' }] }]} />
              </View>

              {heatmapOn && (
                <View style={StyleSheet.absoluteFill}>
                  {[...Array(8)].map((_, i) => (
                    <View key={i} style={[styles.heatDot, {
                      top: 20 + (i * 25) % 120,
                      left: 20 + (i * 37) % 180,
                      backgroundColor: i % 3 === 0 ? '#C0445A' : i % 3 === 1 ? '#B07D3A' : '#3A7D44',
                    }]} />
                  ))}
                </View>
              )}
            </View>

            {/* Route inputs */}
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
              <View style={styles.inputRow}>
                <View style={[styles.dot, { backgroundColor: '#3A7D44' }]} />
                <TextInput
                  style={[styles.routeInput, { color: colors.foreground }]}
                  value={fromInput}
                  onChangeText={setFromInput}
                  placeholder="From"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.inputRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <TextInput
                  style={[styles.routeInput, { color: colors.foreground }]}
                  value={toInput}
                  onChangeText={setToInput}
                  placeholder="To"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            {/* Routes */}
            {routes.map(route => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedRoute === route.id ? scoreColor(route.score) : 'transparent',
                    borderWidth: selectedRoute === route.id ? 2 : 0,
                  }
                ]}
                onPress={() => setSelectedRoute(route.id)}
                activeOpacity={0.8}
              >
                <View style={styles.routeTop}>
                  <Text style={[styles.routeName, { color: colors.foreground }]}>{route.name}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: scoreColor(route.score) }]}>
                    <Text style={styles.scoreText}>{route.score}/100</Text>
                  </View>
                </View>
                {route.id === '1' && (
                  <View style={[styles.safestBadge, { backgroundColor: colors.safe + '20' }]}>
                    <Feather name="award" size={12} color={colors.safe} />
                    <Text style={[styles.safestText, { color: colors.safe }]}>Safest Route</Text>
                  </View>
                )}
                <View style={styles.routeMeta}>
                  <View style={styles.metaItem}>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{route.distance}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{route.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="sun" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{route.lighting}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="users" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{route.crowd}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'zones' && (
          <>
            <Text style={[styles.zoneHeader, { color: colors.primary }]}>
              Danger Zones
            </Text>
            {dangerZones.map(zone => (
              <View key={zone.id} style={[styles.zoneCard, { backgroundColor: colors.card }]}>
                <View style={[styles.zoneLeft, { backgroundColor: severityColor(zone.severity) + '20' }]}>
                  <Feather name="alert-triangle" size={18} color={severityColor(zone.severity)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneName, { color: colors.foreground }]}>{zone.name}</Text>
                  <Text style={[styles.zoneDesc, { color: colors.mutedForeground }]}>{zone.desc}</Text>
                  <Text style={[styles.zoneReports, { color: severityColor(zone.severity) }]}>{zone.reports} reports</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: severityColor(zone.severity) + '20' }]}>
                  <Text style={[styles.severityText, { color: severityColor(zone.severity) }]}>
                    {zone.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={[styles.zoneHeader, { color: colors.safe, marginTop: 8 }]}>Safe Zones</Text>
            {safeZones.map(zone => (
              <View key={zone.id} style={[styles.zoneCard, { backgroundColor: colors.card }]}>
                <View style={[styles.zoneLeft, { backgroundColor: colors.safe + '20' }]}>
                  <Feather name="shield" size={18} color={colors.safe} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneName, { color: colors.foreground }]}>{zone.name}</Text>
                  <Text style={[styles.zoneDesc, { color: colors.mutedForeground }]}>{zone.desc}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: colors.safe + '20' }]}>
                  <Text style={[styles.severityText, { color: colors.safe }]}>SAFE</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Report FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 90 }]}
        onPress={() => setReportVisible(true)}
      >
        <Feather name="plus" size={22} color="#fff" />
        <Text style={styles.fabText}>Report</Text>
      </TouchableOpacity>

      {/* Report Modal */}
      <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setReportVisible(false)} activeOpacity={1} />
        <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Report Incident</Text>

          <View style={[styles.locationRow, { backgroundColor: colors.secondary }]}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.foreground }]}>Bengaluru, Karnataka (Current Location)</Text>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Incident Type</Text>
          <View style={styles.incidentTypes}>
            {incidentTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: incidentType === type ? colors.primary : colors.secondary,
                    borderColor: incidentType === type ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setIncidentType(type)}
              >
                <Text style={[styles.typeText, { color: incidentType === type ? '#fff' : colors.foreground }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.anonRow}
            onPress={() => setAnonymous(a => !a)}
          >
            <View style={[styles.checkbox, {
              backgroundColor: anonymous ? colors.primary : 'transparent',
              borderColor: anonymous ? colors.primary : colors.border,
            }]}>
              {anonymous && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text style={[styles.anonText, { color: colors.foreground }]}>Submit anonymously</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={submitReport}>
            <Text style={styles.submitText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  heatmapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 11,
    alignItems: 'center',
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  scroll: { paddingHorizontal: 16 },
  mapBox: {
    height: 200, borderRadius: 20, marginBottom: 14,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  mapOverlay: { ...StyleSheet.absoluteFillObject },
  mapDecor: { position: 'absolute', borderWidth: 1 },
  mapContent: { alignItems: 'center', zIndex: 1 },
  mapLabel: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  mapSub: { fontSize: 11, marginTop: 2 },
  routeLines: {
    position: 'absolute', width: '100%', height: 3, gap: 8, top: '50%',
    flexDirection: 'column', paddingHorizontal: 20,
  },
  routeLine: { height: 3, borderRadius: 2, marginVertical: 6 },
  heatDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, opacity: 0.7 },
  inputCard: {
    borderRadius: 16, padding: 4, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeInput: { flex: 1, fontSize: 15 },
  divider: { height: 1, marginLeft: 40 },
  routeCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  routeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routeName: { fontSize: 15, fontWeight: '700', flex: 1 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  safestBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  safestText: { fontSize: 11, fontWeight: '700' },
  routeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  zoneHeader: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  zoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  zoneLeft: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  zoneName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  zoneDesc: { fontSize: 12, marginBottom: 2 },
  zoneReports: { fontSize: 11, fontWeight: '600' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute', right: 20, flexDirection: 'row',
    alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 28, shadowColor: '#C0445A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, marginBottom: 16,
  },
  locationText: { fontSize: 14 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  incidentTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  typeText: { fontSize: 13, fontWeight: '600' },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  anonText: { fontSize: 14 },
  submitBtn: {
    height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
