import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Animated, Platform, Linking, ActivityIndicator
} from 'react-native';
import { NATIVE_DRIVER } from '../constants/anim';
import MapView, { Circle, Polyline, Marker, PROVIDER_DEFAULT } from '../components/SafeMapView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useApp } from '../context/AppContext';
import Toast from '../components/Toast';
import SOSModal from '../components/SOSModal';
import { getCurrentLocation, Coords } from '../lib/emergency';

function distanceMeters(a: Coords, b: Coords) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const BENGALURU = { latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.14, longitudeDelta: 0.12 };

const allZones = [
  { id: 's1', name: 'Indiranagar', desc: 'Indiranagar — Well lit, high footfall', severity: 'safe', latitude: 12.9784, longitude: 77.6408, radius: 600 },
  { id: 's2', name: 'Koramangala', desc: 'Koramangala — Active area, CCTV coverage', severity: 'safe', latitude: 12.9352, longitude: 77.6245, radius: 500 },
  { id: 's3', name: 'Whitefield IT Park', desc: 'Whitefield — Secured zone, security guards', severity: 'safe', latitude: 12.9698, longitude: 77.7500, radius: 700 },
  { id: 's4', name: 'MG Road', desc: 'MG Road — High police presence', severity: 'safe', latitude: 12.9756, longitude: 77.6097, radius: 400 },
  { id: 'c1', name: 'Majestic Bus Stand', desc: 'Majestic — Crowded, stay alert', severity: 'caution', latitude: 12.9775, longitude: 77.5713, radius: 500 },
  { id: 'c2', name: 'Shivajinagar', desc: 'Shivajinagar — Moderate risk after 8PM', severity: 'caution', latitude: 12.9853, longitude: 77.6010, radius: 450 },
  { id: 'c3', name: 'Hebbal', desc: 'Hebbal — Isolated stretches near lake', severity: 'caution', latitude: 13.0353, longitude: 77.5947, radius: 550 },
  { id: 'c4', name: 'Marathahalli', desc: 'Marathahalli — Traffic congestion, be cautious', severity: 'caution', latitude: 12.9591, longitude: 77.6974, radius: 500 },
  { id: 'd1', name: 'Mysore Road', desc: 'Mysore Road — High harassment reports', severity: 'danger', latitude: 12.9483, longitude: 77.5413, radius: 600 },
  { id: 'd2', name: 'KR Market', desc: 'KR Market — Pickpocketing and harassment', severity: 'danger', latitude: 12.9659, longitude: 77.5770, radius: 400 },
  { id: 'd3', name: 'Tin Factory', desc: 'Tin Factory — Poor lighting, isolated at night', severity: 'danger', latitude: 12.9955, longitude: 77.6603, radius: 450 },
  { id: 'd4', name: 'Banashankari', desc: 'Banashankari — Reported incidents after 9PM', severity: 'danger', latitude: 12.9256, longitude: 77.5468, radius: 500 },
];

const dangerZones = allZones.filter(z => z.severity === 'danger');
const cautionZones = allZones.filter(z => z.severity === 'caution');
const safeZones = allZones.filter(z => z.severity === 'safe');

const route1 = [{ latitude: 12.9716, longitude: 77.5946 }, { latitude: 12.975, longitude: 77.61 }, { latitude: 12.9784, longitude: 77.625 }, { latitude: 12.98, longitude: 77.64 }];
const route2 = [{ latitude: 12.9716, longitude: 77.5946 }, { latitude: 12.968, longitude: 77.608 }, { latitude: 12.965, longitude: 77.62 }, { latitude: 12.98, longitude: 77.64 }];
const route3 = [{ latitude: 12.9716, longitude: 77.5946 }, { latitude: 12.96, longitude: 77.6 }, { latitude: 12.958, longitude: 77.62 }, { latitude: 12.98, longitude: 77.64 }];

const routesData = [
  { id: '1', name: 'Route via Indiranagar', score: 91, distance: '4.2 km', time: '18 min', lighting: 'Good', crowd: 'High', coords: route1, color: '#3A7D44' },
  { id: '2', name: 'Route via Domlur', score: 74, distance: '3.8 km', time: '16 min', lighting: 'Moderate', crowd: 'Medium', coords: route2, color: '#B07D3A' },
  { id: '3', name: 'Route via Silk Board', score: 58, distance: '3.1 km', time: '14 min', lighting: 'Poor', crowd: 'Low', coords: route3, color: '#C0445A' },
];

const incidentTypes = ['Harassment', 'Poor Lighting', 'Theft', 'Suspicious Person'];

const severityColor = (s: string) => s === 'danger' ? '#C0445A' : s === 'caution' ? '#B07D3A' : '#3A7D44';
const severityFill = (s: string) => s === 'danger' ? 'rgba(192,68,90,0.25)' : s === 'caution' ? 'rgba(176,125,58,0.18)' : 'rgba(58,125,68,0.18)';

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { recordIncident, recordSOS, logActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'route' | 'zones'>('route');
  const [fromInput, setFromInput] = useState('Home');
  const [toInput, setToInput] = useState('MG Road Metro');
  const [selectedRoute, setSelectedRoute] = useState('1');
  const [reportVisible, setReportVisible] = useState(false);
  const [incidentType, setIncidentType] = useState(incidentTypes[0]);
  const [anonymous, setAnonymous] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showAllZones, setShowAllZones] = useState(true);
  const [userLoc, setUserLoc] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [areaCheck, setAreaCheck] = useState<null | { tone: 'safe' | 'caution' | 'danger' | 'info'; text: string }>(null);
  const [sosVisible, setSOSVisible] = useState(false);
  const [toastTone, setToastTone] = useState<'success' | 'warning' | 'info'>('success');
  const slideAnim = useRef(new Animated.Value(500)).current;

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 0 : insets.bottom;

  const openReport = () => {
    setReportVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: NATIVE_DRIVER, tension: 80, friction: 12 }).start();
  };
  const closeReport = () => {
    Animated.timing(slideAnim, { toValue: 500, duration: 250, useNativeDriver: NATIVE_DRIVER }).start(() => setReportVisible(false));
  };
  const submitReport = () => {
    closeReport();
    recordIncident(incidentType);
    setToastTone('info');
    setToastMsg("Report saved on this device. Community sharing isn't live yet.");
    setToastVisible(true);
  };

  const checkMyArea = async () => {
    setLocating(true);
    setAreaCheck(null);
    const loc = await getCurrentLocation();
    setLocating(false);
    if (!loc.ok) {
      setAreaCheck({ tone: 'info', text: `${loc.reason}. Allow location access to check your area.` });
      return;
    }
    setUserLoc(loc.coords);
    const ranked = allZones
      .map(z => ({ z, d: distanceMeters(loc.coords, z) }))
      .sort((a, b) => a.d - b.d);
    const inside = ranked.find(r => r.d <= r.z.radius);
    const nearest = ranked[0];
    if (inside) {
      const detail = inside.z.desc.split('— ')[1] ?? '';
      setAreaCheck({ tone: inside.z.severity as 'safe' | 'caution' | 'danger', text: `You are inside the sample "${inside.z.name}" ${inside.z.severity} zone. ${detail}` });
      logActivity(`Checked area: inside ${inside.z.name} (${inside.z.severity})`, 'map');
    } else if (nearest.d < 3000) {
      setAreaCheck({ tone: 'info', text: `No sample zone at your position. Nearest: ${nearest.z.name} (${nearest.z.severity}), ${(nearest.d / 1000).toFixed(1)} km away.` });
    } else {
      setAreaCheck({ tone: 'info', text: `You're ${(nearest.d / 1000).toFixed(0)} km from the sample Bengaluru zones, so there's no zone data for your area yet.` });
    }
  };

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromInput)}&destination=${encodeURIComponent(toInput)}&travelmode=walking`;
    Linking.openURL(url).catch(() => {});
  };

  const visibleZones = showAllZones ? allZones : dangerZones;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast message={toastMsg} tone={toastTone} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <SOSModal
        visible={sosVisible}
        onCancel={() => setSOSVisible(false)}
        onComplete={summary => {
          setSOSVisible(false);
          recordSOS(summary);
          setToastTone(summary.startsWith('SOS sent') ? 'success' : 'warning');
          setToastMsg(summary);
          setToastVisible(true);
        }}
      />

      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Map</Text>
        <TouchableOpacity
          style={[styles.layerBtn, { backgroundColor: showAllZones ? colors.primary : colors.card }]}
          onPress={() => setShowAllZones(v => !v)}
        >
          <Ionicons name="layers" size={16} color={showAllZones ? '#fff' : colors.foreground} />
          <Text style={{ color: showAllZones ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '600' }}>
            {showAllZones ? 'All Zones' : 'Danger Only'}
          </Text>
        </TouchableOpacity>
      </View>

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

      <View style={[styles.disclaimer, { backgroundColor: colors.accent + '14' }]}>
        <Ionicons name="information-circle" size={14} color={colors.accent} />
        <Text style={[styles.disclaimerText, { color: colors.accent }]}>
          Demo data: zones and route scores are illustrative samples for Bengaluru, not real crime statistics.
        </Text>
      </View>

      {activeTab === 'route' && (
        <View style={{ flex: 1 }}>
          <View style={{ position: 'relative' }}>
            <MapView style={styles.map} provider={PROVIDER_DEFAULT} initialRegion={BENGALURU} showsUserLocation={!!userLoc} userLocation={userLoc}>
              {routesData.map(route => (
                <React.Fragment key={route.id}>
                  <Polyline
                    coordinates={route.coords}
                    strokeColor={route.color}
                    strokeWidth={selectedRoute === route.id ? 5 : 2}
                    lineDashPattern={selectedRoute === route.id ? undefined : [8, 4]}
                  />
                  <Marker coordinate={route.coords[0]} title={route.name} pinColor={route.color}>
                    <View style={[styles.scoreMarker, { backgroundColor: route.color }]}>
                      <Text style={styles.scoreMarkerText}>{route.score}</Text>
                    </View>
                  </Marker>
                </React.Fragment>
              ))}
              <Marker coordinate={{ latitude: 12.9716, longitude: 77.5946 }} title="Start" pinColor="#3A7D44" />
              <Marker coordinate={{ latitude: 12.98, longitude: 77.64 }} title="MG Road Metro" pinColor="#C0445A" />
            </MapView>
            <View style={styles.legend}>
              {[['#3A7D44', 'Safe'], ['#B07D3A', 'Caution'], ['#C0445A', 'Danger']].map(([color, label]) => (
                <View key={label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}>
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
              <View style={styles.inputRow}>
                <View style={[styles.dot, { backgroundColor: '#3A7D44' }]} />
                <TextInput style={[styles.routeInput, { color: colors.foreground }]} value={fromInput} onChangeText={setFromInput} placeholder="From" placeholderTextColor={colors.mutedForeground} />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.inputRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <TextInput style={[styles.routeInput, { color: colors.foreground }]} value={toInput} onChangeText={setToInput} placeholder="To" placeholderTextColor={colors.mutedForeground} />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.directionsBtn, { backgroundColor: colors.foreground, opacity: fromInput.trim() && toInput.trim() ? 1 : 0.4 }]}
              disabled={!fromInput.trim() || !toInput.trim()}
              onPress={openDirections}
            >
              <Ionicons name="walk" size={16} color="#fff" />
              <Text style={styles.directionsText}>Open walking directions in Google Maps</Text>
              <Ionicons name="open-outline" size={14} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.sampleLabel, { color: colors.mutedForeground }]}>Sample route safety scores</Text>
            {routesData.map(route => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  { backgroundColor: colors.card, borderLeftColor: route.color, borderColor: selectedRoute === route.id ? route.color : 'transparent', borderWidth: 2 }
                ]}
                onPress={() => setSelectedRoute(route.id)}
                activeOpacity={0.8}
              >
                <View style={styles.routeTop}>
                  <View style={[styles.routeColorDot, { backgroundColor: route.color }]} />
                  <Text style={[styles.routeName, { color: colors.foreground }]}>{route.name}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: route.color }]}>
                    <Text style={styles.scoreText}>{route.score}/100</Text>
                  </View>
                </View>
                {route.id === '1' && (
                  <View style={styles.safestBadge}>
                    <Ionicons name="trophy" size={12} color="#3A7D44" />
                    <Text style={styles.safestText}>Safest Route</Text>
                  </View>
                )}
                <View style={styles.routeMeta}>
                  {[{ icon: 'location', val: route.distance }, { icon: 'time', val: route.time }, { icon: 'sunny', val: route.lighting }, { icon: 'people', val: route.crowd }].map((m, i) => (
                    <View key={i} style={styles.metaItem}>
                      <Ionicons name={m.icon as any} size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{m.val}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeTab === 'zones' && (
        <View style={{ flex: 1 }}>
          <View style={{ position: 'relative' }}>
            <MapView style={styles.map} provider={PROVIDER_DEFAULT} initialRegion={BENGALURU} showsUserLocation={!!userLoc} userLocation={userLoc}>
              {visibleZones.map(zone => (
                <React.Fragment key={zone.id}>
                  <Circle
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={zone.radius}
                    fillColor={severityFill(zone.severity)}
                    strokeColor={severityColor(zone.severity)}
                    strokeWidth={2}
                  />
                  <Marker coordinate={{ latitude: zone.latitude, longitude: zone.longitude }} title={zone.name} description={zone.desc} pinColor={severityColor(zone.severity)} />
                </React.Fragment>
              ))}
            </MapView>
            <View style={styles.legend}>
              {[['#3A7D44', 'Safe'], ['#B07D3A', 'Caution'], ['#C0445A', 'Danger']].map(([color, label]) => (
                <View key={label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}>
            <TouchableOpacity
              style={[styles.simulateBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary }]}
              onPress={checkMyArea}
              disabled={locating}
            >
              {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="locate" size={16} color={colors.primary} />}
              <Text style={[styles.simulateBtnText, { color: colors.primary }]}>{locating ? 'Finding you…' : 'Check my current area'}</Text>
            </TouchableOpacity>
            {areaCheck && (
              <View style={[styles.areaCard, { backgroundColor: colors.card, borderLeftColor: areaCheck.tone === 'info' ? '#1565C0' : severityColor(areaCheck.tone) }]}>
                <Text style={[styles.areaText, { color: colors.foreground }]}>{areaCheck.text}</Text>
                {(areaCheck.tone === 'danger' || areaCheck.tone === 'caution') && (
                  <TouchableOpacity style={[styles.areaSos, { backgroundColor: colors.primary }]} onPress={() => setSOSVisible(true)}>
                    <Ionicons name="alert-circle" size={14} color="#fff" />
                    <Text style={styles.areaSosText}>Feel unsafe? Start SOS</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {[
              { title: 'Danger Zones', zones: dangerZones },
              { title: 'Caution Zones', zones: cautionZones },
              { title: 'Safe Zones', zones: safeZones },
            ].map(({ title, zones }) => (
              <View key={title}>
                <Text style={[styles.zoneHeader, { color: severityColor(zones[0].severity) }]}>{title}</Text>
                {zones.map(zone => (
                  <View key={zone.id} style={[styles.zoneCard, { backgroundColor: colors.card, borderLeftColor: severityColor(zone.severity) }]}>
                    <View style={[styles.zoneLeft, { backgroundColor: severityColor(zone.severity) + '20' }]}>
                      <Ionicons name={zone.severity === 'safe' ? 'shield-checkmark' : zone.severity === 'caution' ? 'warning' : 'alert-circle'} size={18} color={severityColor(zone.severity)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.zoneName, { color: colors.foreground }]}>{zone.name}</Text>
                      <Text style={[styles.zoneDesc, { color: colors.mutedForeground }]}>{zone.desc}</Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: severityColor(zone.severity) + '20' }]}>
                      <Text style={[styles.severityText, { color: severityColor(zone.severity) }]}>{zone.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, bottom: 16 }]} onPress={openReport}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>Report</Text>
      </TouchableOpacity>

      <Modal visible={reportVisible} transparent animationType="none" onRequestClose={closeReport}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} onPress={closeReport} activeOpacity={1} />
          <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Report Incident</Text>
            <Text style={[styles.sheetNote, { color: colors.mutedForeground }]}>Saved privately on this device for now. Community sharing needs a backend that isn't built yet.</Text>
            <View style={[styles.locationRow, { backgroundColor: colors.secondary }]}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.foreground }]}>{userLoc ? `Near ${userLoc.latitude.toFixed(4)}, ${userLoc.longitude.toFixed(4)}` : 'Location not attached. Tap "Check my current area" first.'}</Text>
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Incident Type</Text>
            <View style={styles.incidentTypes}>
              {incidentTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    { backgroundColor: incidentType === type ? colors.primary : colors.secondary, borderColor: incidentType === type ? colors.primary : colors.border }
                  ]}
                  onPress={() => setIncidentType(type)}
                >
                  <Text style={[styles.typeText, { color: incidentType === type ? '#fff' : colors.foreground }]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.anonRow} onPress={() => setAnonymous(a => !a)}>
              <View style={[styles.checkbox, { backgroundColor: anonymous ? colors.primary : 'transparent', borderColor: anonymous ? colors.primary : colors.border }]}>
                {anonymous && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={[styles.anonText, { color: colors.foreground }]}>Submit anonymously</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={submitReport}>
              <Text style={styles.submitText}>Save Report</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  layerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabs: {
    flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  map: { height: 240 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  disclaimerText: { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 15 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, marginBottom: 16 },
  directionsText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sampleLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  areaCard: { borderRadius: 14, borderLeftWidth: 3, padding: 14, marginBottom: 16, gap: 10 },
  areaText: { fontSize: 13, lineHeight: 19 },
  areaSos: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16 },
  areaSosText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sheetNote: { fontSize: 12, lineHeight: 17, marginTop: -8, marginBottom: 14 },
  legend: {
    position: 'absolute', left: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10, padding: 8, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '600', color: '#333' },
  inputCard: {
    borderRadius: 16, padding: 4, marginBottom: 12, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeInput: { flex: 1, fontSize: 15 },
  divider: { height: 1, marginLeft: 40 },
  routeCard: {
    borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  routeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  routeColorDot: { width: 10, height: 10, borderRadius: 5 },
  scoreMarker: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  scoreMarkerText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  routeName: { fontSize: 14, fontWeight: '700', flex: 1 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  safestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10, backgroundColor: '#3A7D4420' },
  safestText: { fontSize: 11, fontWeight: '700', color: '#3A7D44' },
  routeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  simulateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 16,
  },
  simulateBtnText: { fontSize: 14, fontWeight: '700' },
  zoneHeader: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  zoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, marginBottom: 10, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  zoneLeft: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  zoneName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  zoneDesc: { fontSize: 12, lineHeight: 16 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 28,
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  locationText: { fontSize: 14 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  incidentTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  typeText: { fontSize: 13, fontWeight: '600' },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  anonText: { fontSize: 14 },
  submitBtn: {
    height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C0445A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
