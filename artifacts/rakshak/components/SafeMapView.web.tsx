import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web stub — react-native-maps is native-only
const MapView = ({ style, children, ...props }: any) => (
  <View style={[styles.placeholder, style]}>
    <Text style={styles.icon}>🗺️</Text>
    <Text style={styles.text}>Interactive map available in Expo Go on your device</Text>
    <Text style={styles.sub}>Bengaluru · 12.9716° N, 77.5946° E</Text>
  </View>
);

// Stub out all map sub-components for web
export const Circle = () => null;
export const Polyline = () => null;
export const Marker = () => null;
export const PROVIDER_DEFAULT = undefined;
export default MapView;

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8DF',
    gap: 8,
  },
  icon: { fontSize: 36 },
  text: { fontSize: 14, fontWeight: '600', color: '#8A7A6A', textAlign: 'center', paddingHorizontal: 20 },
  sub: { fontSize: 11, color: '#8A7A6A' },
});
